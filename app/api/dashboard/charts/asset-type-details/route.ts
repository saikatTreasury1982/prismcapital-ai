import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { auth } from '@/app/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('type');

    if (!assetType) {
      return NextResponse.json({ error: 'Asset type required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Query to get tickers for a specific asset type
    const result = await db.$client.execute({
      sql: `
        SELECT 
          p.ticker,
          p.ticker_name,
          p.total_shares as quantity,
          (p.total_shares * p.average_cost) as capital_invested,
          p.current_value,
          p.unrealized_pnl,
          p.position_currency
        FROM positions p
        JOIN asset_classifications ac ON p.ticker = ac.ticker AND p.user_id = ac.user_id
        JOIN asset_types at ON ac.type_id = at.type_code
        WHERE p.user_id = ? AND p.is_active = 1 AND at.type_name = ?
        ORDER BY capital_invested DESC
      `,
      args: [userId, assetType],
    });

    const tickers = result.rows.map(row => ({
      ticker: row.ticker,
      tickerName: row.ticker_name,
      quantity: Number(row.quantity) || 0,
      capitalInvested: Number(row.capital_invested) || 0,
      currentValue: Number(row.current_value) || 0,
      unrealizedPnL: Number(row.unrealized_pnl) || 0,
      currency: row.position_currency || 'USD',
    }));

    return NextResponse.json({ 
      assetType,
      tickers 
    });
  } catch (error: any) {
    console.error('Asset type details error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}