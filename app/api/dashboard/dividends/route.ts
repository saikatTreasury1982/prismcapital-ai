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
    const currentYear = new Date().getFullYear();

    // Get summary by ticker with ticker names
    const tickerSummary = await db.$client.execute({
      sql: `
        SELECT 
          dst.*,
          p.ticker_name
        FROM dividend_summary_by_ticker dst
        LEFT JOIN positions p ON dst.ticker = p.ticker AND dst.user_id = p.user_id
        WHERE dst.user_id = ? 
        ORDER BY dst.total_dividends_received DESC
      `,
      args: [userId],
    });

    // Get quarterly breakdown for current year
    const quarterlyData = await db.$client.execute({
      sql: `
        SELECT * FROM dividend_summary_by_quarter 
        WHERE user_id = ? AND year = ?
        ORDER BY quarter DESC
      `,
      args: [userId, currentYear],
    });

    // Get year-to-date dividends
    const ytdResult = await db.$client.execute({
      sql: `SELECT * FROM dividend_summary_by_year WHERE user_id = ? AND year = ?`,
      args: [userId, currentYear],
    });

    // Get all-time total
    const allTimeResult = await db.$client.execute({
      sql: `
        SELECT 
          COUNT(DISTINCT ticker) as total_stocks,
          SUM(total_dividends_received) as total_dividends
        FROM dividend_summary_by_ticker 
        WHERE user_id = ?
      `,
      args: [userId],
    });

    const allTimeData = allTimeResult.rows[0];
    const ytdData = ytdResult.rows[0];

    const tickerBreakdown = tickerSummary.rows.map(row => ({
      ticker: row.ticker,
      tickerName: row.ticker_name || row.ticker,
      totalPayments: Number(row.total_dividend_payments) || 0,
      totalReceived: Number(row.total_dividends_received) || 0,
      avgPerShare: Number(row.avg_dividend_per_share) || 0,
      latestDate: row.latest_dividend_date,
    }));

    const quarterlyBreakdown = quarterlyData.rows.map(row => ({
      year: Number(row.year),
      quarter: Number(row.quarter),
      stocksPaid: Number(row.stocks_paid_dividends) || 0,
      totalPayments: Number(row.total_dividend_payments) || 0,
      totalReceived: Number(row.total_dividends_received) || 0,
      startDate: row.quarter_start_date,
      endDate: row.quarter_end_date,
    }));

    return NextResponse.json({
      summary: {
        totalDividends: Number(allTimeData?.total_dividends) || 0,
        ytdDividends: Number(ytdData?.total_dividends_received) || 0,
        dividendPayingStocks: Number(allTimeData?.total_stocks) || 0,
        ytdPayments: Number(ytdData?.total_dividend_payments) || 0,
      },
      breakdown: tickerBreakdown,
      quarterly: quarterlyBreakdown,
    });
  } catch (error: any) {
    console.error('Dashboard dividends error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}