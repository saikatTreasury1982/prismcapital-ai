import { NextResponse } from 'next/server';
import { signOut } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    await signOut({
      redirect: false,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Logout error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}