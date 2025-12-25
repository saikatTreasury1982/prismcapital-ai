import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, gte, and } from 'drizzle-orm';

const { dividends } = schema;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    console.log('Fetching upcoming dividends for user:', userId);
    console.log('Today date:', todayStr);

    // Get all dividends where ex_dividend_date >= today
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
          eq(dividends.user_id, userId),
          gte(dividends.ex_dividend_date, todayStr)
        )
      )
      .orderBy(dividends.ex_dividend_date)
      .limit(20);

    console.log('Found dividends:', upcomingDividends.length);

    // Calculate days until for each dividend
    const dividendsWithDays = upcomingDividends.map(d => {
      const exDivDate = new Date(d.ex_dividend_date);
      const daysUntil = Math.ceil((exDivDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...d,
        days_until: daysUntil
      };
    });

    return NextResponse.json({ dividends: dividendsWithDays });
  } catch (e: any) {
    console.error('Upcoming dividends error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}