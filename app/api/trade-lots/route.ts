import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const ticker = searchParams.get('ticker');
    const status = searchParams.get('status'); // 'OPEN', 'CLOSED', 'PARTIAL'

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('trade_lots')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    // Filter by ticker if provided
    if (ticker) {
      query = query.eq('ticker', ticker);
    }

    // Filter by status if provided
    if (status) {
      if (status === 'OPEN') {
        query = query.in('lot_status', ['OPEN', 'PARTIAL']);
      } else {
        query = query.eq('lot_status', status);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Trade lots fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch trade lots' }, { status: 500 });
  }
}