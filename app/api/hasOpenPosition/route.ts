import { NextResponse } from 'next/server';
import { hasOpenPosition } from '../../services/newsService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 });

  try {
    const hasPosition = await hasOpenPosition(ticker);
    return NextResponse.json({ hasPosition });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
