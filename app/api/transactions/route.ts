import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch single transaction or list of transactions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const userId = searchParams.get('userId');
    const ticker = searchParams.get('ticker');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch single transaction
    if (transactionId) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.error('Transaction fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Fetch transactions list
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    // Filter by ticker if provided
    if (ticker) {
      query = query.eq('ticker', ticker);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Transactions fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST - Create new transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, transactionData } = body;

    if (!userId || !transactionData) {
      return NextResponse.json({ error: 'userId and transactionData required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        ticker: transactionData.ticker.toUpperCase(),
        exchange_id: transactionData.exchange_id,
        transaction_type_id: transactionData.transaction_type_id,
        transaction_date: transactionData.transaction_date,
        quantity: transactionData.quantity,
        price: transactionData.price,
        fees: transactionData.fees || 0,
        transaction_currency: transactionData.transaction_currency || 'USD',
        notes: transactionData.notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Transaction create error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create transaction' }, { status: 500 });
  }
}

// PATCH - Update transaction (notes and fees only)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, transactionData } = body;

    if (!transactionId || !transactionData) {
      return NextResponse.json({ error: 'transactionId and transactionData required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Only allow updating notes and fees
    const updateData: any = {};
    if (transactionData.notes !== undefined) updateData.notes = transactionData.notes;
    if (transactionData.fees !== undefined) updateData.fees = transactionData.fees;

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('transaction_id', transactionId)
      .select()
      .single();

    if (error) {
      console.error('Transaction update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE - Delete transaction
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('transaction_id', transactionId);

    if (error) {
      console.error('Transaction delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete transaction' }, { status: 500 });
  }
}