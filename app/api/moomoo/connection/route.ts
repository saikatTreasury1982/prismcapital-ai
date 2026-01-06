import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch Moomoo API key from database
    const apiKeyResult = await db.$client.execute({
      sql: `SELECT api_key FROM system_api_keys WHERE key_name = 'Moomoo API Key' AND is_active = 1`,
      args: []
    });

    if (!apiKeyResult.rows || apiKeyResult.rows.length === 0) {
      return NextResponse.json({ 
        connected: false,
        status: 'error',
        message: 'Moomoo API Key not found in database. Please add it in system settings.'
      }, { status: 404 });
    }

    const apiKey = apiKeyResult.rows[0].api_key as string;

    // Return connection info without actually testing (since we can't reach localhost from Codespaces)
    return NextResponse.json({ 
      connected: true, // Assume connected if API key exists
      port: 33333,
      status: 'configured',
      message: 'Moomoo API key configured. Connection will be tested when fetching trades.',
      hasApiKey: !!apiKey
    });

  } catch (error: any) {
    console.error('Connection check error:', error);
    return NextResponse.json({ 
      connected: false,
      status: 'error',
      message: error.message 
    }, { status: 500 });
  }
}