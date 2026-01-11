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
          p.position_id,
          p.total_shares,
          p.average_cost,
          COUNT(*) as total_dividend_payments,
          ROUND(SUM(d.dividend_per_share * d.shares_owned), 4) as total_dividends_received,
          ROUND(AVG(d.dividend_per_share), 4) as avg_dividend_per_share,
          MAX(d.dividend_yield) as market_yield,
          GROUP_CONCAT(d.ex_dividend_date, '|') as ex_div_dates,
          GROUP_CONCAT(d.payment_date, '|') as payment_dates
        FROM dividends d
        LEFT JOIN positions p ON d.ticker = p.ticker AND d.user_id = p.user_id
        WHERE d.user_id = ? 
          AND d.ex_dividend_date <= ?
        GROUP BY d.ticker, p.ticker_name, p.position_id, p.total_shares, p.average_cost
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
          p.position_id,
          p.total_shares,
          p.average_cost,
          COUNT(*) as total_dividend_payments,
          ROUND(SUM(d.dividend_per_share * d.shares_owned), 4) as total_dividends_received,
          ROUND(AVG(d.dividend_per_share), 4) as avg_dividend_per_share,
          MAX(d.dividend_yield) as market_yield,
          GROUP_CONCAT(d.ex_dividend_date, '|') as ex_div_dates,
          GROUP_CONCAT(d.payment_date, '|') as payment_dates
        FROM dividends d
        LEFT JOIN positions p ON d.ticker = p.ticker AND d.user_id = p.user_id
        WHERE d.user_id = ? 
          AND CAST(strftime('%Y', d.ex_dividend_date) AS INTEGER) = ?
          AND d.ex_dividend_date <= ?
        GROUP BY d.ticker, p.ticker_name, p.position_id, p.total_shares, p.average_cost
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

    // Helper to calculate total capital deployed for a position
    const calculateCapitalDeployed = async (positionId: number | null, currentShares: number, avgCost: number, userId: string): Promise<number> => {
      const currentCapital = currentShares * avgCost;
      
      if (!positionId) {
        return currentCapital;
      }
      
      // Get historical closed capital from realized_pnl_history
      const historicalResult = await db.$client.execute({
        sql: `
          SELECT COALESCE(SUM(total_cost), 0) as historical_capital
          FROM realized_pnl_history
          WHERE position_id = ? AND user_id = ?
        `,
        args: [positionId, userId],
      });
      
      const historicalCapital = Number(historicalResult.rows[0]?.historical_capital) || 0;
      return currentCapital + historicalCapital;
    };

    const upcomingData = upcomingResult.rows[0];

    const allTimeData = allTimeResult.rows[0];
    const ytdData = ytdResult.rows[0];

    const allTimeBreakdown = await Promise.all(
      allTimeTickerSummary.rows.map(async (row) => {
        const totalDividends = Number(row.total_dividends_received) || 0;
        const currentShares = Number(row.total_shares) || 0;
        const avgCost = Number(row.average_cost) || 0;
        const positionId = row.position_id ? Number(row.position_id) : null;
        
        // Calculate total capital deployed
        const totalCapital = await calculateCapitalDeployed(positionId, currentShares, avgCost, userId);
        
        // Calculate personal yield
        const personalYield = totalCapital > 0 ? (totalDividends / totalCapital) * 100 : 0;
        
        return {
          ticker: row.ticker,
          tickerName: row.ticker_name || row.ticker,
          totalPayments: Number(row.total_dividend_payments) || 0,
          totalReceived: totalDividends,
          avgPerShare: Number(row.avg_dividend_per_share) || 0,
          marketYield: Number(row.market_yield) || 0,
          personalYield: Number(personalYield.toFixed(2)),
          exDivDates: row.ex_div_dates ? (row.ex_div_dates as string).split('|').sort().reverse() : [],
          paymentDates: row.payment_dates ? (row.payment_dates as string).split('|').sort().reverse() : [],
        };
      })
    );

    const ytdBreakdown = await Promise.all(
      ytdTickerSummary.rows.map(async (row) => {
        const totalDividends = Number(row.total_dividends_received) || 0;
        const currentShares = Number(row.total_shares) || 0;
        const avgCost = Number(row.average_cost) || 0;
        const positionId = row.position_id ? Number(row.position_id) : null;
        
        // For YTD: use current capital if shares > 0, else historical capital
        let effectiveCapital = currentShares * avgCost;
        
        if (currentShares === 0 && positionId) {
          // Position exited - use historical capital
          const historicalResult = await db.$client.execute({
            sql: `
              SELECT COALESCE(SUM(total_cost), 0) as historical_capital
              FROM realized_pnl_history
              WHERE position_id = ? AND user_id = ?
            `,
            args: [positionId, userId],
          });
          effectiveCapital = Number(historicalResult.rows[0]?.historical_capital) || 0;
        }
        
        // Calculate personal yield
        const personalYield = effectiveCapital > 0 ? (totalDividends / effectiveCapital) * 100 : 0;
        
        return {
          ticker: row.ticker,
          tickerName: row.ticker_name || row.ticker,
          totalPayments: Number(row.total_dividend_payments) || 0,
          totalReceived: totalDividends,
          avgPerShare: Number(row.avg_dividend_per_share) || 0,
          marketYield: Number(row.market_yield) || 0,
          personalYield: Number(personalYield.toFixed(2)),
          exDivDates: row.ex_div_dates ? (row.ex_div_dates as string).split('|').sort().reverse() : [],
          paymentDates: row.payment_dates ? (row.payment_dates as string).split('|').sort().reverse() : [],
        };
      })
    );

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