import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, gte, lt, desc, sql } from 'drizzle-orm';

const { dividends } = schema;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const year = searchParams.get('year');
  const quarter = searchParams.get('quarter');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '5');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    // If year and quarter provided, get detailed dividends
    if (year && quarter) {
      const offset = (page - 1) * pageSize;
      const yearNum = parseInt(year);
      const quarterNum = parseInt(quarter);

      const startMonth = (quarterNum - 1) * 3 + 1;
      const endMonth = quarterNum * 3 + 1;
      const startDate = `${yearNum}-${String(startMonth).padStart(2, '0')}-01`;
      const endDate = quarterNum === 4 ? `${yearNum + 1}-01-01` : `${yearNum}-${String(endMonth).padStart(2, '0')}-01`;

      // Use ex_dividend_date for grouping into quarters
      const data = await db
        .select()
        .from(dividends)
        .where(
          and(
            eq(dividends.user_id, userId),
            gte(dividends.ex_dividend_date, startDate),
            lt(dividends.ex_dividend_date, endDate)
          )
        )
        .orderBy(desc(dividends.ex_dividend_date))
        .limit(pageSize)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(dividends)
        .where(
          and(
            eq(dividends.user_id, userId),
            gte(dividends.ex_dividend_date, startDate),
            lt(dividends.ex_dividend_date, endDate)
          )
        );

      return NextResponse.json({ data, total: countResult[0]?.count || 0 });
    }

    // Get summary by quarter (using raw SQL for view)
    const data = await db.all(sql`
      SELECT * FROM dividend_summary_by_quarter
      WHERE user_id = ${userId}
      ORDER BY year DESC, quarter DESC
    `);

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching dividends by quarter:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}