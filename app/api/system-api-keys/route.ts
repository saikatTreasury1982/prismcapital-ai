import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';

const { systemApiKeys } = schema;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceName = searchParams.get('service');
    
    if (!serviceName) {
      return NextResponse.json({ error: 'service parameter required' }, { status: 400 });
    }

    // Map service names to service_ids
    const serviceIdMap: Record<string, number> = {
      'alphavantage': 1,
      'alpha_vantage': 1,
      // Add other services as needed
    };

    const serviceId = serviceIdMap[serviceName.toLowerCase()];
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Unknown service' }, { status: 400 });
    }

    // Fetch active, primary API key for the service
    const apiKey = await db
      .select()
      .from(systemApiKeys)
      .where(
        and(
          eq(systemApiKeys.service_id, serviceId),
          eq(systemApiKeys.is_active, 1),
          eq(systemApiKeys.is_primary, 1)
        )
      )
      .limit(1);

    if (!apiKey || apiKey.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      api_key: apiKey[0].api_key,
      key_name: apiKey[0].key_name 
    });
  } catch (e: any) {
    console.error('Error fetching API key:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch API key' }, { status: 500 });
  }
}