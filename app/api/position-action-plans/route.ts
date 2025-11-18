import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';
import { sql } from 'drizzle-orm';

const { positionActionPlans, positions } = schema;

// GET - Fetch position action plans
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = session.user.id;
    const status = searchParams.get('status');
    const positionId = searchParams.get('position_id');

    // Build conditions
    const conditions = [eq(positionActionPlans.user_id, userId)];
    
    if (status) {
      conditions.push(eq(positionActionPlans.status, status));
    }

    if (positionId) {
      conditions.push(eq(positionActionPlans.position_id, parseInt(positionId)));
    }

    // Join with positions to get ticker info
    const data = await db
      .select({
        plan: positionActionPlans,
        position: positions,
      })
      .from(positionActionPlans)
      .leftJoin(
        positions,
        eq(positionActionPlans.position_id, positions.position_id)
      )
      .where(and(...conditions))
      .orderBy(desc(positionActionPlans.created_at));

    // Flatten the response
    const flattenedData = data.map(row => ({
      ...row.plan,
      ticker: row.position?.ticker,
      ticker_name: row.position?.ticker_name,
      total_shares: row.position?.total_shares,
      average_cost: row.position?.average_cost,
      current_market_price: row.position?.current_market_price,
      position_currency: row.position?.position_currency,
    }));

    return NextResponse.json({ data: flattenedData });
  } catch (e: any) {
    console.error('Error fetching position action plans:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch plans' }, { status: 500 });
  }
}

// POST - Create new position action plan
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { planData } = body;
    const userId = session.user.id;

    if (!planData) {
      return NextResponse.json({ error: 'planData required' }, { status: 400 });
    }

    const data = await db
      .insert(positionActionPlans)
      .values({
        user_id: userId,
        position_id: planData.position_id,
        action_type: planData.action_type,
        sell_percentage: planData.sell_percentage || null,
        sell_shares: planData.sell_shares || null,
        expected_proceeds: planData.expected_proceeds || null,
        reinvest_ticker: planData.reinvest_ticker || null,
        reinvest_amount: planData.reinvest_amount || null,
        withdraw_amount: planData.withdraw_amount || null,
        withdraw_currency: planData.withdraw_currency || null,
        notes: planData.notes || null,
      })
      .returning();

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Error creating position action plan:', e);
    return NextResponse.json({ error: e.message || 'Failed to create plan' }, { status: 500 });
  }
}

// PATCH - Update position action plan
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { planId, planData } = body;

    if (!planId || !planData) {
      return NextResponse.json({ error: 'planId and planData required' }, { status: 400 });
    }

    // Build update object
    const updateData: any = {
      updated_at: sql`datetime('now')`,
    };

    // Update only provided fields
    if (planData.action_type !== undefined) updateData.action_type = planData.action_type;
    if (planData.sell_percentage !== undefined) updateData.sell_percentage = planData.sell_percentage;
    if (planData.sell_shares !== undefined) updateData.sell_shares = planData.sell_shares;
    if (planData.expected_proceeds !== undefined) updateData.expected_proceeds = planData.expected_proceeds;
    if (planData.reinvest_ticker !== undefined) updateData.reinvest_ticker = planData.reinvest_ticker;
    if (planData.reinvest_amount !== undefined) updateData.reinvest_amount = planData.reinvest_amount;
    if (planData.withdraw_amount !== undefined) updateData.withdraw_amount = planData.withdraw_amount;
    if (planData.withdraw_currency !== undefined) updateData.withdraw_currency = planData.withdraw_currency;
    if (planData.notes !== undefined) updateData.notes = planData.notes;
    if (planData.status !== undefined) updateData.status = planData.status;

    const data = await db
      .update(positionActionPlans)
      .set(updateData)
      .where(eq(positionActionPlans.plan_id, planId))
      .returning();

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Error updating position action plan:', e);
    return NextResponse.json({ error: e.message || 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE - Delete position action plan
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'planId required' }, { status: 400 });
    }

    await db
      .delete(positionActionPlans)
      .where(eq(positionActionPlans.plan_id, parseInt(planId)));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error deleting position action plan:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete plan' }, { status: 500 });
  }
}