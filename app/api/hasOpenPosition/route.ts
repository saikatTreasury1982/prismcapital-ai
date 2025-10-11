import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const userId = searchParams.get('userId');
  
  if (!ticker || !userId) {
    return NextResponse.json({ error: 'ticker and userId required' }, { status: 400 });
  }

  try {
    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if user has open position for this ticker
const { data, error } = await supabase
      .from('positions')
      .select('position_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .ilike('ticker', ticker)
      .limit(1);
    
    if (error) {
      console.error('Position check error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ hasPosition: data.length > 0 });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}