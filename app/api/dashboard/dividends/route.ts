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

    // Get ALL-TIME summary by ticker - filtered by current date
    const allTimeTickerSummary = await db.$client.execute({
      sql: `
        SELECT 
          d.ticker,
          p.ticker_name,
          COUNT(*) as total_dividend_payments,
          ROUND(SUM(d.dividend_per_share * d.shares_owned), 4) as total_dividends_received,
          ROUND(AVG(d.dividend_per_share), 4) as avg_dividend_per_share,
          MAX(CASE WHEN d.ex_dividend_date IS NOT NULL THEN d.ex_dividend_date END) as latest_ex_div_date,
          MAX(CASE WHEN d.payment_date IS NOT NULL THEN d.payment_date END) as latest_payment_date
        FROM dividends d
        LEFT JOIN positions p ON d.ticker = p.ticker AND d.user_id = p.user_id
        WHERE d.user_id = ? 
          AND (d.payment_date IS NULL OR d.payment_date <= ?)
        GROUP BY d.ticker, p.ticker_name
        ORDER BY total_dividends_received DESC
      `,
      args: [userId, currentDate],
    });

    // Get YTD summary by ticker - filtered by current year and current date
    const ytdTickerSummary = await db.$client.execute({
      sql: `
        SELECT 
          d.ticker,
          p.ticker_name,
          COUNT(*) as total_dividend_payments,
          ROUND(SUM(d.dividend_per_share * d.shares_owned), 4) as total_dividends_received,
          ROUND(AVG(d.dividend_per_share), 4) as avg_dividend_per_share,
          MAX(CASE WHEN d.ex_dividend_date IS NOT NULL THEN d.ex_dividend_date END) as latest_ex_div_date,
          MAX(CASE WHEN d.payment_date IS NOT NULL THEN d.payment_date END) as latest_payment_date
        FROM dividends d
        LEFT JOIN positions p ON d.ticker = p.ticker AND d.user_id = p.user_id
        WHERE d.user_id = ? 
          AND (
            (d.payment_date IS NOT NULL AND CAST(strftime('%Y', d.payment_date) AS INTEGER) = ? AND d.payment_date <= ?)
            OR (d.payment_date IS NULL AND CAST(strftime('%Y', d.ex_dividend_date) AS INTEGER) = ?)
          )
        GROUP BY d.ticker, p.ticker_name
        ORDER BY total_dividends_received DESC
      `,
      args: [userId, currentYear, currentDate, currentYear],
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
          AND (
            (payment_date IS NOT NULL AND CAST(strftime('%Y', payment_date) AS INTEGER) = ? AND payment_date <= ?)
            OR (payment_date IS NULL AND CAST(strftime('%Y', ex_dividend_date) AS INTEGER) = ?)
          )
      `,
      args: [userId, currentYear, currentDate, currentYear],
    });

    // Get all-time total
    const allTimeResult = await db.$client.execute({
      sql: `
        SELECT 
          COUNT(DISTINCT ticker) as total_stocks,
          ROUND(SUM(dividend_per_share * shares_owned), 4) as total_dividends
        FROM dividends
        WHERE user_id = ?
          AND payment_date <= ?
      `,
      args: [userId, currentDate],
    });

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
      },
      allTimeBreakdown,
      ytdBreakdown,
    });
  } catch (error: any) {
    console.error('Dashboard dividends error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}