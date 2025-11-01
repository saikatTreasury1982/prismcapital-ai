import { NextResponse } from 'next/server';
import { getUniquePeriods } from '@/app/services/cashMovementService';
import { auth } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const periods = await getUniquePeriods(session.user.id);
    return NextResponse.json({ periods });
  } catch (error: any) {
    console.error('Error fetching periods:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch periods' },
      { status: 500 }
    );
  }
}