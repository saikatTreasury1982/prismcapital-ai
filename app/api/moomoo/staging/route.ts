import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

// GET - Fetch all staging records for user
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = session.user.id;
    const status = searchParams.get('status'); // Optional filter

    let sql = `
      SELECT * FROM moomoo_import_staging 
      WHERE user_id = ?
    `;
    const args: any[] = [userId];

    if (status) {
      sql += ` AND status = ?`;
      args.push(status);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await db.$client.execute({ sql, args });

    return NextResponse.json({ 
      data: result.rows,
      count: result.rows.length 
    });

  } catch (error: any) {
    console.error('Error fetching staging records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Insert multiple staging records (from Moomoo fetch)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { trades } = body; // Array of trade objects
    const userId = session.user.id; // ✅ Get user_id from session

    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: 'Trades array required' }, { status: 400 });
    }

    // Generate batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const importTimestamp = new Date().toISOString();

    // Insert all trades into staging
    const insertedRecords = [];

    for (const trade of trades) {
      // Check for duplicate before inserting
      const duplicateCheck = await db.$client.execute({
        sql: `
          SELECT staging_id FROM moomoo_import_staging 
          WHERE user_id = ? 
            AND ticker = ? 
            AND transaction_date = ? 
            AND transaction_type_id = ? 
            AND quantity = ? 
            AND price = ?
        `,
        args: [
          userId,
          trade.ticker,
          trade.transaction_date,
          trade.transaction_type_id,
          trade.quantity,
          trade.price
        ]
      });

      // Skip if duplicate found
      if (duplicateCheck.rows && duplicateCheck.rows.length > 0) {
        console.log(`Skipping duplicate: ${trade.ticker} on ${trade.transaction_date}`);
        continue;
      }

      const result = await db.$client.execute({
        sql: `
          INSERT INTO moomoo_import_staging (
            user_id, import_batch_id, import_timestamp, status,
            moomoo_fill_id, moomoo_order_id,
            ticker, ticker_name, transaction_type_id, transaction_date,
            quantity, price, trade_value, fees, transaction_currency,
            strategy_code, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          userId,
          batchId,
          importTimestamp,
          'imported',
          trade.moomoo_fill_id,
          trade.moomoo_order_id || null,
          trade.ticker,
          trade.ticker_name || null,
          trade.transaction_type_id,
          trade.transaction_date,
          trade.quantity,
          trade.price,
          trade.quantity * trade.price,
          trade.fees || 0,
          trade.transaction_currency || 'USD',
          trade.strategy_code || null,
          trade.notes || null
        ]
      });

      insertedRecords.push(Number(result.lastInsertRowid));
    }

    return NextResponse.json({ 
      message: `${insertedRecords.length} trades imported to staging`,
      batchId,
      insertedCount: insertedRecords.length,
      stagingIds: insertedRecords.map(id => Number(id))
    });

  } catch (error: any) {
    console.error('Error inserting staging records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}