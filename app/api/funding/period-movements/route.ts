import { NextResponse } from 'next/server';
import { getMovementsForPeriod } from '@/app/services/cashMovementService';
import { auth } from '@/app/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodFrom = searchParams.get('periodFrom');
    const periodTo = searchParams.get('periodTo');

    if (!periodFrom) {
      return NextResponse.json(
        { error: 'periodFrom is required' },
        { status: 400 }
      );
    }

    const movements = await getMovementsForPeriod(
      session.user.id,
      periodFrom,
      periodTo === 'null' ? null : periodTo
    );

    return NextResponse.json({ movements });
  } catch (error: any) {
    console.error('Error fetching period movements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch movements' },
      { status: 500 }
    );
  }
}