import { db, schema } from '../lib/db';
import { eq, and, gte, lt, desc, asc } from 'drizzle-orm';
import { 
  Dividend,
  DividendSummaryByTicker,
  DividendSummaryByQuarter,
  DividendSummaryByYear,
  PositionForDividend
} from '../lib/types/dividend';

const { positions, dividends, dividendSummaryByTicker, dividendSummaryByQuarter, dividendSummaryByYear } = schema;

export async function getOpenPositionsForDividends(userId: string): Promise<PositionForDividend[]> {
  const data = await db
    .select({
      position_id: positions.position_id,
      ticker: positions.ticker,
      ticker_name: positions.ticker_name,
      total_shares: positions.total_shares,
      average_cost: positions.average_cost,
      current_market_price: positions.current_market_price,
    })
    .from(positions)
    .where(
      and(
        eq(positions.user_id, userId),
        eq(positions.is_active, 1)
      )
    )
    .orderBy(asc(positions.ticker));
  
  return data as PositionForDividend[];
}

export async function getDividendSummaryByTicker(userId: string): Promise<DividendSummaryByTicker[]> {
  const data = await db
    .select()
    .from(dividendSummaryByTicker)
    .where(eq(dividendSummaryByTicker.user_id, userId))
    .orderBy(desc(dividendSummaryByTicker.total_dividends_received));
  
  return data as any;
}

export async function getDividendSummaryByQuarter(userId: string): Promise<DividendSummaryByQuarter[]> {
  const data = await db
    .select()
    .from(dividendSummaryByQuarter)
    .where(eq(dividendSummaryByQuarter.user_id, userId))
    .orderBy(desc(dividendSummaryByQuarter.year), desc(dividendSummaryByQuarter.quarter));
  
  return data as any;
}

export async function getDividendSummaryByYear(userId: string): Promise<DividendSummaryByYear[]> {
  const data = await db
    .select()
    .from(dividendSummaryByYear)
    .where(eq(dividendSummaryByYear.user_id, userId))
    .orderBy(desc(dividendSummaryByYear.year));
  
  return data as any;
}

export async function getDividendsByTicker(
  userId: string, 
  ticker: string, 
  page: number = 1, 
  pageSize: number = 5
) {
  const offset = (page - 1) * pageSize;
  
  const data = await db
    .select()
    .from(dividends)
    .where(
      and(
        eq(dividends.user_id, userId),
        eq(dividends.ticker, ticker)
      )
    )
    .orderBy(desc(dividends.payment_date))
    .limit(pageSize)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select()
    .from(dividends)
    .where(
      and(
        eq(dividends.user_id, userId),
        eq(dividends.ticker, ticker)
      )
    );
  
  return { data: data as Dividend[], total: countResult.length };
}

export async function getDividendsByQuarter(
  userId: string,
  year: number,
  quarter: number,
  page: number = 1,
  pageSize: number = 5
) {
  const offset = (page - 1) * pageSize;
  
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3 + 1;
  const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(endMonth).padStart(2, '0')}-01`;
  
  const data = await db
    .select()
    .from(dividends)
    .where(
      and(
        eq(dividends.user_id, userId),
        gte(dividends.payment_date, startDate),
        lt(dividends.payment_date, endDate)
      )
    )
    .orderBy(desc(dividends.payment_date))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select()
    .from(dividends)
    .where(
      and(
        eq(dividends.user_id, userId),
        gte(dividends.payment_date, startDate),
        lt(dividends.payment_date, endDate)
      )
    );
  
  return { data: data as Dividend[], total: countResult.length };
}

export async function getDividendsByYear(
  userId: string,
  year: number,
  page: number = 1,
  pageSize: number = 5
) {
  const offset = (page - 1) * pageSize;
  
  const data = await db
    .select()
    .from(dividends)
    .where(eq(dividends.user_id, userId))
    .orderBy(desc(dividends.payment_date))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select()
    .from(dividends)
    .where(eq(dividends.user_id, userId));
  
  return { data: data as Dividend[], total: countResult.length };
}