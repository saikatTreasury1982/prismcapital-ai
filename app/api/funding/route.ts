import { NextResponse } from 'next/server';
import { getUserCurrencies, getCashMovements, getPeriodStats } from '@/app/services/cashMovementService';
import { auth } from '@/app/lib/auth';

export async function GET() {
  try {
    // Get authenticated user from session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const [currencies, movements, periodStats] = await Promise.all([
      getUserCurrencies(userId),
      getCashMovements(userId),
      getPeriodStats(userId)
    ]);

    return NextResponse.json({
      currencies,
      movements,
      periodStats
    });
  } catch (error: any) {
    console.error('Error fetching funding data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch funding data' },
      { status: 500 }
    );
  }
}