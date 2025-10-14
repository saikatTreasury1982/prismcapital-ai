import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch classification for a ticker
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const ticker = searchParams.get('ticker');
    const exchangeId = searchParams.get('exchangeId');

    if (!userId || !ticker || !exchangeId) {
      return NextResponse.json({ error: 'userId, ticker, and exchangeId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('asset_classifications')
      .select('*')
      .eq('user_id', userId)
      .eq('ticker', ticker)
      .eq('exchange_id', parseInt(exchangeId))
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Asset classification fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch asset classification' }, { status: 500 });
  }
}

// POST - Create or Update classification (upsert)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, classificationData } = body;

    if (!userId || !classificationData) {
      return NextResponse.json({ error: 'userId and classificationData required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('asset_classifications')
      .upsert({
        user_id: userId,
        ticker: classificationData.ticker.toUpperCase(),
        exchange_id: classificationData.exchange_id,
        class_id: classificationData.class_id,
        type_id: classificationData.type_id || null
      }, {
        onConflict: 'user_id,ticker,exchange_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Asset classification upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to save asset classification' }, { status: 500 });
  }
}

// DELETE - Delete classification
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classificationId = searchParams.get('classificationId');

    if (!classificationId) {
      return NextResponse.json({ error: 'classificationId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('asset_classifications')
      .delete()
      .eq('classification_id', classificationId);

    if (error) {
      console.error('Asset classification delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete asset classification' }, { status: 500 });
  }
}