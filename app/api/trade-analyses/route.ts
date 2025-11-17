import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';
import { sql } from 'drizzle-orm';

const { tradeAnalyses } = schema;

// Helper function to calculate metrics
function calculateMetrics(entry: number, stopLoss: number, takeProfit: number, positionSize: number) {
  const sharesToBuy = parseFloat((positionSize / entry).toFixed(4));
  const riskPercentage = parseFloat((((entry - stopLoss) / entry) * 100).toFixed(2));
  const rewardPercentage = parseFloat((((takeProfit - entry) / entry) * 100).toFixed(2));
  const riskRewardRatio = riskPercentage !== 0 ? parseFloat((rewardPercentage / riskPercentage).toFixed(2)) : 0;

  return {
    shares_to_buy: sharesToBuy,
    risk_percentage: riskPercentage,
    reward_percentage: rewardPercentage,
    risk_reward_ratio: riskRewardRatio,
  };
}

// GET - Fetch trade analyses
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = session.user.id;
    const status = searchParams.get('status');
    const isFlagged = searchParams.get('isFlagged');

    // Build conditions
    const conditions = [eq(tradeAnalyses.user_id, userId)];
    
    if (status) {
      conditions.push(eq(tradeAnalyses.status, status));
    }
    
    if (isFlagged === 'true') {
      conditions.push(eq(tradeAnalyses.is_flagged, 1));
    }

    const data = await db
      .select()
      .from(tradeAnalyses)
      .where(and(...conditions))
      .orderBy(desc(tradeAnalyses.created_at));

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching trade analyses:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch trade analyses' }, { status: 500 });
  }
}

// POST - Create new trade analysis
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { analysisData } = body;
    const userId = session.user.id;

    if (!analysisData) {
      return NextResponse.json({ error: 'analysisData required' }, { status: 400 });
    }

    // Calculate metrics
    const metrics = calculateMetrics(
      analysisData.entry_price,
      analysisData.stop_loss,
      analysisData.take_profit,
      analysisData.position_size
    );

    const data = await db
      .insert(tradeAnalyses)
      .values({
        user_id: userId,
        ticker: analysisData.ticker.toUpperCase(),
        exchange_code: analysisData.exchange_code || null,
        entry_price: analysisData.entry_price,
        position_size: analysisData.position_size,
        stop_loss: analysisData.stop_loss,
        take_profit: analysisData.take_profit,
        ...metrics,
        notes: analysisData.notes || null,
      })
      .returning();

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Error creating trade analysis:', e);
    return NextResponse.json({ error: e.message || 'Failed to create trade analysis' }, { status: 500 });
  }
}

// PATCH - Update trade analysis
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { analysisId, analysisData } = body;

    if (!analysisId || !analysisData) {
      return NextResponse.json({ error: 'analysisId and analysisData required' }, { status: 400 });
    }

    // Fetch existing analysis to get all values
    const existing = await db
      .select()
      .from(tradeAnalyses)
      .where(eq(tradeAnalyses.analysis_id, analysisId))
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const current = existing[0];

    // Build update object
    const updateData: any = {
      updated_at: sql`datetime('now')`,
    };

    // Update only provided fields
    if (analysisData.entry_price !== undefined) updateData.entry_price = analysisData.entry_price;
    if (analysisData.position_size !== undefined) updateData.position_size = analysisData.position_size;
    if (analysisData.stop_loss !== undefined) updateData.stop_loss = analysisData.stop_loss;
    if (analysisData.take_profit !== undefined) updateData.take_profit = analysisData.take_profit;
    if (analysisData.is_flagged !== undefined) updateData.is_flagged = analysisData.is_flagged;
    if (analysisData.status !== undefined) updateData.status = analysisData.status;
    if (analysisData.notes !== undefined) updateData.notes = analysisData.notes;

    // Recalculate metrics if any price changed
    const entry = updateData.entry_price ?? current.entry_price;
    const stopLoss = updateData.stop_loss ?? current.stop_loss;
    const takeProfit = updateData.take_profit ?? current.take_profit;
    const positionSize = updateData.position_size ?? current.position_size;

    const metrics = calculateMetrics(entry, stopLoss, takeProfit, positionSize);
    Object.assign(updateData, metrics);

    const data = await db
      .update(tradeAnalyses)
      .set(updateData)
      .where(eq(tradeAnalyses.analysis_id, analysisId))
      .returning();

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Error updating trade analysis:', e);
    return NextResponse.json({ error: e.message || 'Failed to update trade analysis' }, { status: 500 });
  }
}

// DELETE - Delete trade analysis
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId required' }, { status: 400 });
    }

    await db
      .delete(tradeAnalyses)
      .where(eq(tradeAnalyses.analysis_id, parseInt(analysisId)));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error deleting trade analysis:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete trade analysis' }, { status: 500 });
  }
}