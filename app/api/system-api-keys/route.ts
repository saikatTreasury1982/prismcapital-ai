import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { systemApiKeys } = schema;

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceCode = searchParams.get('service_code');
    const keyName = searchParams.get('key_name');
    
    if (!serviceCode) {
      return NextResponse.json({ 
        error: 'service_code parameter required' 
      }, { status: 400 });
    }

    // Build query conditions
    const conditions = [
      eq(systemApiKeys.user_id, session.user.id),
      eq(systemApiKeys.service_code, serviceCode)
    ];

    // Optionally filter by key_name if provided
    if (keyName) {
      conditions.push(eq(systemApiKeys.key_name, keyName));
    }

    // Fetch API key(s)
    const apiKeys = await db
      .select()
      .from(systemApiKeys)
      .where(and(...conditions))
      .limit(keyName ? 1 : 100); // Single key if name specified, otherwise all for service

    if (!apiKeys || apiKeys.length === 0) {
      return NextResponse.json({ 
        error: 'API key not found',
        message: `No API key found for user_id: ${session.user.id}, service_code: ${serviceCode}${keyName ? `, key_name: ${keyName}` : ''}` 
      }, { status: 404 });
    }

    // Return single key or array
    const response = keyName ? apiKeys[0] : apiKeys;

    return NextResponse.json({ 
      success: true,
      data: response
    });
  } catch (e: any) {
    console.error('Error fetching API key:', e);
    return NextResponse.json({ 
      error: e.message || 'Failed to fetch API key' 
    }, { status: 500 });
  }
}

// POST - Save/Update API key
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      service_code, 
      api_key, 
      key_name, 
      environment = 'PRODUCTION',
      daily_request_limit,
      notes 
    } = body;

    if (!service_code || !api_key || !key_name) {
      return NextResponse.json(
        { error: 'service_code, api_key, and key_name are required' },
        { status: 400 }
      );
    }

    // Check if key already exists (by user_id, service_code, key_name)
    const existing = await db
      .select()
      .from(systemApiKeys)
      .where(
        and(
          eq(systemApiKeys.user_id, session.user.id),
          eq(systemApiKeys.service_code, service_code),
          eq(systemApiKeys.key_name, key_name)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing key
      await db
        .update(systemApiKeys)
        .set({
          api_key,
          environment,
          daily_request_limit,
          notes,
          updated_at: new Date().toISOString(),
        })
        .where(eq(systemApiKeys.api_key_id, existing[0].api_key_id));

      return NextResponse.json({
        success: true,
        message: 'API key updated successfully',
        data: {
          api_key_id: existing[0].api_key_id,
          service_code,
          key_name,
        }
      });
    } else {
      // Insert new key
      const result = await db.insert(systemApiKeys).values({
        user_id: session.user.id,
        service_code,
        api_key,
        key_name,
        environment,
        daily_request_limit,
        notes,
      }).returning();

      return NextResponse.json({
        success: true,
        message: 'API key saved successfully',
        data: result[0]
      });
    }
  } catch (error: any) {
    console.error('Error saving API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save API key' },
      { status: 500 }
    );
  }
}

// DELETE - Remove API key
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get('api_key_id');
    
    if (!apiKeyId) {
      return NextResponse.json({ 
        error: 'api_key_id parameter required' 
      }, { status: 400 });
    }

    // Verify ownership before deleting
    const existing = await db
      .select()
      .from(systemApiKeys)
      .where(
        and(
          eq(systemApiKeys.api_key_id, parseInt(apiKeyId)),
          eq(systemApiKeys.user_id, session.user.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'API key not found or unauthorized' 
      }, { status: 404 });
    }

    await db
      .delete(systemApiKeys)
      .where(eq(systemApiKeys.api_key_id, parseInt(apiKeyId)));

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete API key' },
      { status: 500 }
    );
  }
}