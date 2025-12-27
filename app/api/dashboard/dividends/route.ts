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
    const currentDate = new Date().toISOString().split('T')[0];

    // Get ALL-TIME summary by ticker - filtered by ex_dividend_date
    const allTimeTickerSummary = await db.$client.execute({
      sql: `
        SELECT 
          d.ticker,
          p.ticker_name,
          COUNT(*) as total_dividend_payments,
          ROUND(SUM(d.dividend_per_share * d.shares_owned), 4) as total_dividends_received,
          ROUND(AVG(d.dividend_per_share), 4) as avg_dividend_per_share,
          MAX(d.ex_dividend_date) as latest_ex_div_date,
          MAX(d.payment_date) as latest_payment_date
        FROM dividends d
        LEFT JOIN positions p ON d.ticker = p.ticker AND d.user_id = p.user_id
        WHERE d.user_id = ? 
          AND d.ex_dividend_date <= ?
        GROUP BY d.ticker, p.ticker_name
        ORDER BY total_dividends_received DESC
      `,
      args: [userId, currentDate],
    });

    // Get YTD summary by ticker - filtered by ex_dividend_date in current year
    const ytdTickerSummary = await db.$client.execute({
      sql: `
        SELECT 
          d.ticker,
          p.ticker_name,
          COUNT(*) as total_dividend_payments,
          ROUND(SUM(d.dividend_per_share * d.shares_owned), 4) as total_dividends_received,
          ROUND(AVG(d.dividend_per_share), 4) as avg_dividend_per_share,
          MAX(d.ex_dividend_date) as latest_ex_div_date,
          MAX(d.payment_date) as latest_payment_date
        FROM dividends d
        LEFT JOIN positions p ON d.ticker = p.ticker AND d.user_id = p.user_id
        WHERE d.user_id = ? 
          AND CAST(strftime('%Y', d.ex_dividend_date) AS INTEGER) = ?
          AND d.ex_dividend_date <= ?
        GROUP BY d.ticker, p.ticker_name
        ORDER BY total_dividends_received DESC
      `,
      args: [userId, currentYear, currentDate],
    });

    // Get year-to-date dividends
    const ytdResult = await db.$client.execute({
      sql: `
        SELECT 
          COUNT(DISTINCT ticker) as stocks_paid_dividends,
          COUNT(*) as total_dividend_payments,
          ROUND(SUM(dividend_per_share * shares_owned), 4) as total_dividends_received
        FROM dividends
        WHERE user_id = ? 
          AND CAST(strftime('%Y', ex_dividend_date) AS INTEGER) = ?
          AND ex_dividend_date <= ?
      `,
      args: [userId, currentYear, currentDate],
    });

    // Get all-time total
    const allTimeResult = await db.$client.execute({
      sql: `
        SELECT 
          COUNT(DISTINCT ticker) as total_stocks,
          ROUND(SUM(dividend_per_share * shares_owned), 4) as total_dividends
        FROM dividends
        WHERE user_id = ?
          AND ex_dividend_date <= ?
      `,
      args: [userId, currentDate],
    });

    // Get upcoming dividends
    const upcomingResult = await db.$client.execute({
      sql: `
        SELECT 
          COUNT(*) as total_upcoming_payments,
          ROUND(SUM(dividend_per_share * shares_owned), 4) as total_upcoming_dividends
        FROM dividends
        WHERE user_id = ?
          AND ex_dividend_date > ?
      `,
      args: [userId, currentDate],
    });

    const upcomingData = upcomingResult.rows[0];

    const allTimeData = allTimeResult.rows[0];
    const ytdData = ytdResult.rows[0];

    const allTimeBreakdown = allTimeTickerSummary.rows.map(row => ({
      ticker: row.ticker,
      tickerName: row.ticker_name || row.ticker,
      totalPayments: Number(row.total_dividend_payments) || 0,
      totalReceived: Number(row.total_dividends_received) || 0,
      avgPerShare: Number(row.avg_dividend_per_share) || 0,
      latestExDivDate: row.latest_ex_div_date || null,
      latestPaymentDate: row.latest_payment_date || null,
    }));

    const ytdBreakdown = ytdTickerSummary.rows.map(row => ({
      ticker: row.ticker,
      tickerName: row.ticker_name || row.ticker,
      totalPayments: Number(row.total_dividend_payments) || 0,
      totalReceived: Number(row.total_dividends_received) || 0,
      avgPerShare: Number(row.avg_dividend_per_share) || 0,
      latestExDivDate: row.latest_ex_div_date || null,
      latestPaymentDate: row.latest_payment_date || null,
    }));

    return NextResponse.json({
      summary: {
        totalDividends: Number(allTimeData?.total_dividends) || 0,
        totalStocks: Number(allTimeData?.total_stocks) || 0,
        ytdDividends: Number(ytdData?.total_dividends_received) || 0,
        ytdStocks: Number(ytdData?.stocks_paid_dividends) || 0,
        ytdPayments: Number(ytdData?.total_dividend_payments) || 0,
        upcomingDividends: Number(upcomingData?.total_upcoming_dividends) || 0,
        upcomingPayments: Number(upcomingData?.total_upcoming_payments) || 0,
      },
      allTimeBreakdown,
      ytdBreakdown,
    });

  } catch (error: any) {
    console.error('Dashboard dividends error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}