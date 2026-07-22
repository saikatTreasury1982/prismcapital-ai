import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';
import { sql } from 'drizzle-orm';

const { tradeAnalyses } = schema;

// Helper function to calculate metrics
function calcAt(entry: number, stopLoss: number | null | undefined, takeProfit: number | null | undefined, positionSize: number) {
  const sharesToBuy = parseFloat((positionSize / entry).toFixed(4));
  let riskPercentage = null;
  let rewardPercentage = null;
  let riskRewardRatio = null;

  if (stopLoss !== null && stopLoss !== undefined && !isNaN(stopLoss)) {
    riskPercentage = parseFloat((((entry - stopLoss) / entry) * 100).toFixed(2));
  }
  if (takeProfit !== null && takeProfit !== undefined && !isNaN(takeProfit)) {
    rewardPercentage = parseFloat((((takeProfit - entry) / entry) * 100).toFixed(2));
  }
  if (riskPercentage !== null && rewardPercentage !== null && riskPercentage !== 0) {
    riskRewardRatio = parseFloat((rewardPercentage / riskPercentage).toFixed(2));
  }
  return { sharesToBuy, riskPercentage, rewardPercentage, riskRewardRatio };
}

function calculateMetrics(
  entryType: string,
  entryPrice: number,
  entryLow: number | null | undefined,
  entryHigh: number | null | undefined,
  stopLoss: number | null | undefined,
  takeProfit: number | null | undefined,
  positionSize: number
) {
  const mid = calcAt(entryPrice, stopLoss, takeProfit, positionSize);

  const base = {
    shares_to_buy: mid.sharesToBuy,
    risk_percentage: mid.riskPercentage,
    reward_percentage: mid.rewardPercentage,
    risk_reward_ratio: mid.riskRewardRatio,
    risk_reward_ratio_low: null as number | null,
    risk_reward_ratio_high: null as number | null,
  };

  if (entryType === 'RANGE' && entryLow != null && entryHigh != null) {
    // best case = buying at the low end, worst case = buying at the high end
    base.risk_reward_ratio_low = calcAt(entryHigh, stopLoss, takeProfit, positionSize).riskRewardRatio;
    base.risk_reward_ratio_high = calcAt(entryLow, stopLoss, takeProfit, positionSize).riskRewardRatio;
  }

  return base;
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
    const entryType = analysisData.entry_type || 'STRICT';
    const entryLow = entryType === 'RANGE' ? analysisData.entry_low : null;
    const entryHigh = entryType === 'RANGE' ? analysisData.entry_high : null;
    const effectiveEntry = entryType === 'RANGE' ? (entryLow + entryHigh) / 2 : analysisData.entry_price;

    const metrics = calculateMetrics(entryType, effectiveEntry, entryLow, entryHigh, analysisData.stop_loss, analysisData.take_profit, analysisData.position_size);

    const data = await db
      .insert(tradeAnalyses)
      .values({
        user_id: userId,
        ticker: analysisData.ticker.toUpperCase(),
        exchange_code: analysisData.exchange_code || null,
        entry_price: effectiveEntry,
        entry_type: entryType,
        entry_low: entryLow,
        entry_high: entryHigh,
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
    if (analysisData.exchange_code !== undefined) {
      updateData.exchange_code = analysisData.exchange_code === '' ? null : analysisData.exchange_code;
    }
    if (analysisData.entry_price !== undefined) updateData.entry_price = analysisData.entry_price;
    if (analysisData.position_size !== undefined) updateData.position_size = analysisData.position_size;
    if (analysisData.stop_loss !== undefined) updateData.stop_loss = analysisData.stop_loss;
    if (analysisData.take_profit !== undefined) updateData.take_profit = analysisData.take_profit;
    if (analysisData.is_flagged !== undefined) updateData.is_flagged = analysisData.is_flagged;
    if (analysisData.status !== undefined) updateData.status = analysisData.status;
    if (analysisData.notes !== undefined) updateData.notes = analysisData.notes;
    if (analysisData.entry_type !== undefined) updateData.entry_type = analysisData.entry_type;
    if (analysisData.entry_low !== undefined) updateData.entry_low = analysisData.entry_low;
    if (analysisData.entry_high !== undefined) updateData.entry_high = analysisData.entry_high;

    // Recalculate metrics — use `in` checks so an explicit null clears rather than falls back
    const entryType = 'entry_type' in updateData ? updateData.entry_type : (current.entry_type ?? 'STRICT');

    const rawEntryLow = 'entry_low' in updateData ? updateData.entry_low : current.entry_low;
    const rawEntryHigh = 'entry_high' in updateData ? updateData.entry_high : current.entry_high;
    const entryLow = entryType === 'RANGE' ? rawEntryLow : null;
    const entryHigh = entryType === 'RANGE' ? rawEntryHigh : null;

    const stopLoss = 'stop_loss' in updateData ? updateData.stop_loss : current.stop_loss;
    const takeProfit = 'take_profit' in updateData ? updateData.take_profit : current.take_profit;
    const positionSize = 'position_size' in updateData ? updateData.position_size : current.position_size;

    const entry = entryType === 'RANGE' && entryLow != null && entryHigh != null
      ? (entryLow + entryHigh) / 2
      : ('entry_price' in updateData ? updateData.entry_price : current.entry_price);

    updateData.entry_price = entry;
    if (entryType === 'STRICT') {
      updateData.entry_low = null;
      updateData.entry_high = null;
    }

    const metrics = calculateMetrics(entryType, entry, entryLow, entryHigh, stopLoss, takeProfit, positionSize);
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
