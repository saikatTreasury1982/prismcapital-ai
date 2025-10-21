import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, gte, lt, desc, sql } from 'drizzle-orm';

const { dividends } = schema;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const year = searchParams.get('year');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '5');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    // If year provided, get detailed dividends
    if (year) {
      const offset = (page - 1) * pageSize;
      const yearNum = parseInt(year);

      const data = await db
        .select()
        .from(dividends)
        .where(
          and(
            eq(dividends.userId, userId),
            gte(dividends.exDividendDate, `${yearNum}-01-01`),
            lt(dividends.exDividendDate, `${yearNum + 1}-01-01`)
          )
        )
        .orderBy(desc(dividends.exDividendDate))
        .limit(pageSize)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(dividends)
        .where(
          and(
            eq(dividends.userId, userId),
            gte(dividends.exDividendDate, `${yearNum}-01-01`),
            lt(dividends.exDividendDate, `${yearNum + 1}-01-01`)
          )
        );

      return NextResponse.json({ data, total: countResult[0]?.count || 0 });
    }

    // Get summary by year (using view)
    const data = await db.all(sql`
      SELECT * FROM dividend_summary_by_year
      WHERE user_id = ${userId}
      ORDER BY year DESC
    `);

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching dividends by year:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}