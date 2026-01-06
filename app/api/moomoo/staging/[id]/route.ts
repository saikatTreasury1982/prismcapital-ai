import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

// GET - Fetch single staging record
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params; // ✅ Await params
    const stagingId = Number(id);
    const userId = session.user.id;

    // Validate stagingId
    if (isNaN(stagingId) || stagingId <= 0) {
      return NextResponse.json({ error: 'Invalid staging ID' }, { status: 400 });
    }

    const result = await db.$client.execute({
      sql: `SELECT * FROM moomoo_import_staging WHERE staging_id = ? AND user_id = ?`,
      args: [stagingId, userId]
    });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: 'Staging record not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });

  } catch (error: any) {
    console.error('Error fetching staging record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update staging record (for editing)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params; // ✅ Await params
    const stagingId = Number(id);
    const userId = session.user.id;
    const body = await request.json();

    // Validate stagingId
    if (isNaN(stagingId) || stagingId <= 0) {
      return NextResponse.json({ error: 'Invalid staging ID' }, { status: 400 });
    }

    // Verify ownership
    const checkResult = await db.$client.execute({
      sql: `SELECT staging_id FROM moomoo_import_staging WHERE staging_id = ? AND user_id = ?`,
      args: [stagingId, userId]
    });

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Staging record not found' }, { status: 404 });
    }

    // Build update fields
    const updates: string[] = [];
    const args: any[] = [];

    if (body.strategy_code !== undefined) {
      updates.push('strategy_code = ?');
      args.push(body.strategy_code);
    }
    if (body.quantity !== undefined) {
      updates.push('quantity = ?');
      args.push(body.quantity);
    }
    if (body.price !== undefined) {
      updates.push('price = ?');
      args.push(body.price);
    }
    if (body.fees !== undefined) {
      updates.push('fees = ?');
      args.push(body.fees);
    }
    if (body.transaction_currency !== undefined) {
      updates.push('transaction_currency = ?');
      args.push(body.transaction_currency);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      args.push(body.notes);
    }
    if (body.transaction_date !== undefined) {
      updates.push('transaction_date = ?');
      args.push(body.transaction_date);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      args.push(body.status);
    }

    // Recalculate trade_value if quantity or price changed
    if (body.quantity !== undefined || body.price !== undefined) {
      updates.push('trade_value = quantity * price');
    }

    // Always update updated_at
    updates.push('updated_at = datetime(\'now\')');

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    args.push(stagingId, userId);

    await db.$client.execute({
      sql: `
        UPDATE moomoo_import_staging 
        SET ${updates.join(', ')}
        WHERE staging_id = ? AND user_id = ?
      `,
      args
    });

    // Fetch updated record
    const updatedResult = await db.$client.execute({
      sql: `SELECT * FROM moomoo_import_staging WHERE staging_id = ?`,
      args: [stagingId]
    });

    return NextResponse.json({ 
      message: 'Staging record updated',
      data: updatedResult.rows[0] 
    });

  } catch (error: any) {
    console.error('Error updating staging record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete staging record
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params; // ✅ Await params
    const stagingId = Number(id);
    const userId = session.user.id;

    // Validate stagingId
    if (isNaN(stagingId) || stagingId <= 0) {
      return NextResponse.json({ error: 'Invalid staging ID' }, { status: 400 });
    }

    const result = await db.$client.execute({
      sql: `DELETE FROM moomoo_import_staging WHERE staging_id = ? AND user_id = ?`,
      args: [stagingId, userId]
    });

    return NextResponse.json({ 
      message: 'Staging record deleted',
      stagingId 
    });

  } catch (error: any) {
    console.error('Error deleting staging record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}