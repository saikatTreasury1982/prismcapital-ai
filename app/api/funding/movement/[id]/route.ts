import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { cashMovements } = schema;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // Await params
    const movementId = parseInt(id);
    if (isNaN(movementId)) {
      return NextResponse.json({ error: 'Invalid movement ID' }, { status: 400 });
    }

    const body = await request.json();

    const {
      home_currency_code,
      home_currency_value,
      trading_currency_code,
      spot_rate,
      spot_rate_isActual,
      direction_id,
      transaction_date,
      period_from,
      period_to,
      notes
    } = body;

    // Validate required fields
    if (!home_currency_value || !spot_rate || !transaction_date || !home_currency_code || !trading_currency_code || !direction_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse values
    const homeValue = parseFloat(home_currency_value);
    const rate = parseFloat(spot_rate);
    const directionId = parseInt(direction_id);

    if (isNaN(homeValue) || isNaN(rate) || isNaN(directionId)) {
      return NextResponse.json(
        { error: 'Invalid numeric values' },
        { status: 400 }
      );
    }

    // Calculate trading currency value
    const trading_currency_value = homeValue * rate;

    // Update the movement
    const result = await db
      .update(cashMovements)
      .set({
        home_currency_code: home_currency_code,
        home_currency_value: homeValue,
        trading_currency_code: trading_currency_code,
        trading_currency_value: trading_currency_value,
        spot_rate: rate,
        spot_rate_isActual: spot_rate_isActual ?? 1, // Default to 1 (Actual) if not provided
        direction_id: directionId,
        transaction_date: transaction_date,
        period_from: period_from || null,
        period_to: period_to || null,
        notes: notes || null,
      })
      .where(
        and(
          eq(cashMovements.cash_movement_id, movementId),
          eq(cashMovements.user_id, session.user.id)
        )
      )
      .returning();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Movement not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    console.error('Error updating movement:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // Await params
    const movementId = parseInt(id);
    if (isNaN(movementId)) {
      return NextResponse.json({ error: 'Invalid movement ID' }, { status: 400 });
    }

    // Delete the movement
    const result = await db
      .delete(cashMovements)
      .where(
        and(
          eq(cashMovements.cash_movement_id, movementId),
          eq(cashMovements.user_id, session.user.id)
        )
      )
      .returning();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Movement not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting movement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}