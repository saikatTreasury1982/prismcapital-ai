import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, asc } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { positions } = schema;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = session.user.id;
    const isActive = searchParams.get('isActive');

    // Build conditions array
    const conditions = [eq(positions.user_id, userId)];
    
    if (isActive === 'true') {
      conditions.push(eq(positions.is_active, 1));
    } else if (isActive === 'false') {
      conditions.push(eq(positions.is_active, 0));
    }

    // Join with asset_classifications and asset_classes to get class info
    const data = await db
      .select({
        position: positions,
        classification: schema.assetClassifications,
        assetClass: schema.assetClasses,
      })
      .from(positions)
      .leftJoin(
        schema.assetClassifications,
        and(
          eq(positions.user_id, schema.assetClassifications.user_id),
          eq(positions.ticker, schema.assetClassifications.ticker),
          eq(positions.exchange_id, schema.assetClassifications.exchange_id)
        )
      )
      .leftJoin(
        schema.assetClasses,
        eq(schema.assetClassifications.class_id, schema.assetClasses.class_code)
      )
      .where(and(...conditions))
      .orderBy(asc(positions.ticker));

    // Flatten the response
    const flattenedData = data.map(row => ({
      ...row.position,
      asset_class: row.assetClass?.class_name || null,
      asset_class_code: row.assetClass?.class_code || null,
    }));

    return NextResponse.json({ data: flattenedData });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch positions' }, { status: 500 });
  }
}