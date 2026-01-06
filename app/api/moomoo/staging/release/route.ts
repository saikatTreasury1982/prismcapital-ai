import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { stagingIds } = body; // Array of staging_id to release
    const userId = session.user.id;

    if (!stagingIds || !Array.isArray(stagingIds) || stagingIds.length === 0) {
      return NextResponse.json({ error: 'Staging IDs required' }, { status: 400 });
    }

    const results = {
      released: [] as number[],
      rejected: [] as { id: number; reason: string }[]
    };

    // Get user's PnL strategy
    const userPrefs = await db.$client.execute({
      sql: `SELECT pnl_strategy_id FROM user_preferences WHERE user_id = ?`,
      args: [userId]
    });

    for (const stagingId of stagingIds) {
      try {
        // Fetch staging record
        const stagingResult = await db.$client.execute({
          sql: `SELECT * FROM moomoo_import_staging WHERE staging_id = ? AND user_id = ?`,
          args: [stagingId, userId]
        });

        if (!stagingResult.rows || stagingResult.rows.length === 0) {
          results.rejected.push({ id: stagingId, reason: 'Record not found' });
          continue;
        }

        const record = stagingResult.rows[0] as any;

        // Validate strategy is assigned
        if (!record.strategy_code) {
          results.rejected.push({ id: stagingId, reason: 'Strategy not assigned' });
          
          // Update status
          await db.$client.execute({
            sql: `UPDATE moomoo_import_staging SET status = 'rejected_error', rejection_reason = 'Strategy required' WHERE staging_id = ?`,
            args: [stagingId]
          });
          continue;
        }

        // Use database transaction for atomicity
        await db.$client.execute({ sql: 'BEGIN TRANSACTION', args: [] });

        try {
          // Insert into transactions table
          const txResult = await db.$client.execute({
            sql: `
              INSERT INTO transactions (
                user_id, ticker, transaction_type_id, transaction_date,
                quantity, price, trade_value, fees, transaction_currency, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
              userId,
              record.ticker,
              record.transaction_type_id,
              record.transaction_date,
              record.quantity,
              record.price,
              record.trade_value,
              record.fees,
              record.transaction_currency,
              record.notes || null
            ]
          });

          // Update positions (if user has aggregated PnL strategy)
          if (userPrefs.rows.length > 0 && userPrefs.rows[0].pnl_strategy_id === 1) {
            const { aggregateToPositionTx, reducePositionTx } = await import('@/app/services/positionService');
            
            if (record.transaction_type_id === 1) {
              // BUY
              await aggregateToPositionTx(db, {
                user_id: userId,
                ticker: record.ticker,
                quantity: record.quantity,
                price: record.price,
                transaction_date: record.transaction_date,
                strategy_code: record.strategy_code,
                transaction_currency: record.transaction_currency,
                ticker_name: record.ticker_name || ''
              });
            } else if (record.transaction_type_id === 2) {
              // SELL
              await reducePositionTx(db, {
                user_id: userId,
                ticker: record.ticker,
                quantity: record.quantity,
                price: record.price,
                transaction_date: record.transaction_date,
                strategy_code: record.strategy_code
              });
            }
          }

          // Delete from staging (successful release)
          await db.$client.execute({
            sql: `DELETE FROM moomoo_import_staging WHERE staging_id = ?`,
            args: [stagingId]
          });

          await db.$client.execute({ sql: 'COMMIT', args: [] });
          results.released.push(stagingId);

        } catch (txError: any) {
          await db.$client.execute({ sql: 'ROLLBACK', args: [] });
          
          // Check if duplicate error
          if (txError.message && txError.message.includes('UNIQUE constraint failed')) {
            results.rejected.push({ id: stagingId, reason: 'Duplicate transaction' });
            
            // Update status
            await db.$client.execute({
              sql: `UPDATE moomoo_import_staging SET status = 'rejected_duplicate', rejection_reason = 'Duplicate entry found in transactions table' WHERE staging_id = ?`,
              args: [stagingId]
            });
          } else {
            results.rejected.push({ id: stagingId, reason: txError.message });
            
            // Update status
            await db.$client.execute({
              sql: `UPDATE moomoo_import_staging SET status = 'rejected_error', rejection_reason = ? WHERE staging_id = ?`,
              args: [txError.message, stagingId]
            });
          }
        }

      } catch (error: any) {
        results.rejected.push({ id: stagingId, reason: error.message });
      }
    }

    return NextResponse.json({
      message: `Released ${results.released.length} of ${stagingIds.length} records`,
      released: results.released,
      rejected: results.rejected,
      summary: {
        total: stagingIds.length,
        success: results.released.length,
        failed: results.rejected.length
      }
    });

  } catch (error: any) {
    console.error('Error releasing staging records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}