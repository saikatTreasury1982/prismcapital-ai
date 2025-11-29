import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { dividends } = schema;

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json({ error: 'ticker required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Get latest dividend for this ticker
    const latestDividend = await db
      .select()
      .from(dividends)
      .where(eq(dividends.ticker, ticker.toUpperCase()))
      .orderBy(desc(dividends.ex_dividend_date))
      .limit(1)
      .all();

    if (!latestDividend || latestDividend.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          last_dividend_per_share: 0,
          ex_dividend_date: null,
          total_dividend_amount: 0
        }
      });
    }

    const dividend = latestDividend[0];

    return NextResponse.json({
      success: true,
      data: {
        last_dividend_per_share: dividend.dividend_per_share,
        ex_dividend_date: dividend.ex_dividend_date,
        total_dividend_amount: dividend.total_dividend_amount
      }
    });
  } catch (error: any) {
    console.error('Error fetching latest dividend:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dividend' },
      { status: 500 }
    );
  }
}