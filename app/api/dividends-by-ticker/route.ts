import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';

const { dividends } = schema;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const ticker = searchParams.get('ticker');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '5');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    // If ticker provided, get detailed dividends
    if (ticker) {
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

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(dividends)
        .where(
          and(
            eq(dividends.user_id, userId),
            eq(dividends.ticker, ticker)
          )
        );

      return NextResponse.json({ data, total: countResult[0]?.count || 0 });
    }

    // Get summary by ticker (using view)
    const data = await db.all(sql`
      SELECT * FROM dividend_summary_by_ticker
      WHERE user_id = ${userId}
      ORDER BY total_dividends_received DESC
    `);

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching dividends by ticker:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}