import { NextResponse } from 'next/server';
import { createCashMovement } from '@/app/services/cashMovementService';
import { auth } from '@/app/lib/auth';

export async function POST(request: Request) {
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
    const body = await request.json();
    
    // Validate required fields
    if (!body.home_currency_value || !body.spot_rate || !body.transaction_date || !body.direction_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createCashMovement(userId, body);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating cash movement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create cash movement' },
      { status: 500 }
    );
  }
}