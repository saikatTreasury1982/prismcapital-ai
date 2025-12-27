import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { and, sql } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { dividends } = schema;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Fetch upcoming dividends where ex_dividend_date is today or in the future
    const upcomingDividends = await db
      .select({
        dividend_id: dividends.dividend_id,
        ticker: dividends.ticker,
        ex_dividend_date: dividends.ex_dividend_date,
        payment_date: dividends.payment_date,
        dividend_per_share: dividends.dividend_per_share,
        shares_owned: dividends.shares_owned,
        total_dividend_amount: dividends.total_dividend_amount,
      })
      .from(dividends)
      .where(
        and(
          sql`${dividends.user_id} = ${userId}`,
          sql`${dividends.ex_dividend_date} > ${today}`
        )
      )
      .orderBy(sql`${dividends.ex_dividend_date} ASC`)
      .limit(20);

    // Calculate days until ex-dividend for each dividend
    const dividendsWithDays = upcomingDividends.map((div) => {
      const exDivDate = new Date(div.ex_dividend_date);
      const todayDate = new Date(today);
      const diffTime = exDivDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...div,
        days_until: diffDays,
      };
    });

    return NextResponse.json({ dividends: dividendsWithDays });
  } catch (e: any) {
    console.error('Error fetching upcoming dividends:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to fetch upcoming dividends' },
      { status: 500 }
    );
  }
}