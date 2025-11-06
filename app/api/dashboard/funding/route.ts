import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { auth } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Query the cash_balance_summary view using Turso client
    const result = await db.$client.execute({
      sql: `SELECT * FROM cash_balance_summary WHERE user_id = ?`,
      args: [userId],
    });

    const data = result.rows[0];

    if (!data) {
      return NextResponse.json({
        summary: {
          totalDeposited: 0,
          totalWithdrawn: 0,
          netCashBalance: 0,
          currency: 'USD',
        },
        details: null,
      });
    }

    return NextResponse.json({
      summary: {
        totalDeposited: Number(data.total_deposited_home) || 0,
        totalWithdrawn: Math.abs(Number(data.total_withdrawn_home)) || 0,
        netCashBalance: Number(data.net_home_currency) || 0,
        currency: data.home_currency_code || 'USD',
      },
      details: {
        tradingCurrency: {
          totalDeposited: Number(data.total_deposited_trading) || 0,
          totalWithdrawn: Math.abs(Number(data.total_withdrawn_trading)) || 0,
          netBalance: Number(data.net_trading_currency) || 0,
        },
        weightedAvgRate: Number(data.weighted_avg_rate) || 0,
        depositCount: Number(data.deposit_count) || 0,
        withdrawalCount: Number(data.withdrawal_count) || 0,
        firstTransactionDate: data.first_transaction_date,
        lastTransactionDate: data.last_transaction_date,
      },
    });
  } catch (error: any) {
    console.error('Dashboard funding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}