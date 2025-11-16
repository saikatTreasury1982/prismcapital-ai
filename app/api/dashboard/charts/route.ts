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

    // Query to get investment by asset type with ticker details
    const result = await db.$client.execute({
      sql: `
        SELECT 
          at.type_name,
          p.ticker,
          p.ticker_name,
          (p.total_shares * p.average_cost) as capital_invested,
          p.current_value
        FROM positions p
        JOIN asset_classifications ac ON p.ticker = ac.ticker AND p.user_id = ac.user_id
        JOIN asset_types at ON ac.type_id = at.type_code
        WHERE p.user_id = ? AND p.is_active = 1
        ORDER BY at.type_name, capital_invested DESC
      `,
      args: [userId],
    });

    // Group by asset type and aggregate
    const groupedData: { [key: string]: any } = {};

    result.rows.forEach(row => {
      const typeName = row.type_name as string;
      
      if (!groupedData[typeName]) {
        groupedData[typeName] = {
          type: typeName,
          capitalInvested: 0,
          currentValue: 0,
          tickers: []
        };
      }

      const capitalInvested = Number(row.capital_invested) || 0;
      const currentValue = Number(row.current_value) || 0;

      groupedData[typeName].capitalInvested += capitalInvested;
      groupedData[typeName].currentValue += currentValue;
      groupedData[typeName].tickers.push({
        ticker: row.ticker,
        tickerName: row.ticker_name,
        capitalInvested,
        currentValue,
      });
    });

    const chartData = Object.values(groupedData).sort(
      (a, b) => b.capitalInvested - a.capitalInvested
    );

    return NextResponse.json({ data: chartData });
  } catch (error: any) {
    console.error('Dashboard charts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}