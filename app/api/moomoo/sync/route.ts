import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { MoomooService } from '@/app/services/moomooService';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';

const { moomooImportStaging, systemApiKeys } = schema;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const { beginTime, endTime } = body;

    if (!beginTime || !endTime) {
      return NextResponse.json(
        { error: 'beginTime and endTime are required (format: YYYY-MM-DD HH:MM:SS)' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting Moomoo sync for user ${userId}: ${beginTime} to ${endTime}`);

    // Step 1: Fetch Moomoo API key from database (server-side)
    const apiKeyRecord = await db
      .select()
      .from(systemApiKeys)
      .where(
        and(
          eq(systemApiKeys.user_id, userId),
          eq(systemApiKeys.service_code, 'MOOMOO')
        )
      )
      .limit(1);

    if (!apiKeyRecord || apiKeyRecord.length === 0) {
      return NextResponse.json(
        { error: 'Moomoo API key not configured. Please add it in system settings.' },
        { status: 404 }
      );
    }

    const websocketKey = apiKeyRecord[0].api_key;

    console.log('🔧 Environment Check:', {
      host: process.env.MOOMOO_OPEND_HOST,
      port: process.env.MOOMOO_OPEND_PORT,
      websocketKey: websocketKey ? `${websocketKey.substring(0, 8)}...` : 'MISSING'
    });

    // Step 2: Build config
    const config = {
      host: process.env.MOOMOO_OPEND_HOST || '127.0.0.1',
      port: parseInt(process.env.MOOMOO_OPEND_PORT || '33333'),
      enableSSL: false,
      websocketKey,
    };

    console.log('📋 Final config:', {
      host: config.host,
      port: config.port,
      enableSSL: config.enableSSL,
      websocketKey: config.websocketKey ? `${config.websocketKey.substring(0, 8)}...` : 'MISSING'
    });
    
    // Step 3: Create service and fetch trades
    const service = new MoomooService(config);

    try {
      console.log('🔌 Connecting to Moomoo API...');
      await service.connect();

      console.log('📋 Fetching accounts...');
      const accounts = await service.getAccounts();

      // Import proto for enums
      const protoRoot = require('moomoo-api/proto.js');
      const { Trd_Common } = protoRoot;

      // Filter for Real US accounts
      const usAccount = accounts.find(
        (acc: any) =>
          acc.trdEnv === Trd_Common.TrdEnv.TrdEnv_Real &&
          acc.trdMarketAuthList.includes(Trd_Common.TrdMarket.TrdMarket_US)
      );

      if (!usAccount) {
        throw new Error('No Real US trading account found');
      }

      console.log(`✅ Using account ID: ${usAccount.accID}`);

      // Fetch trades
      console.log(`📊 Fetching trades from ${beginTime} to ${endTime}...`);
      const deals = await service.fetchTrades(usAccount, beginTime, endTime);

      console.log(`✅ Found ${deals.length} trades`);

      if (deals.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No new trades found in the specified date range',
          count: 0,
        });
      }

      // Fetch fees
      console.log('💰 Fetching fees...');
      const orderIDExList = [...new Set(deals.map((d: any) => d.orderIDEx))];
      const fees = await service.fetchFees(usAccount, orderIDExList);

      console.log(`✅ Fetched fees for ${fees.length} orders`);

      // Convert to staging format
      const stagingTrades = service.convertDealsToStaging(deals, fees);

      console.log(`✅ Converted ${stagingTrades.length} trades to staging format`);

      // Insert into staging table
      const insertedCount = await db.transaction(async (tx) => {
        let count = 0;
        for (const trade of stagingTrades) {
          try {
            await tx.insert(moomooImportStaging).values({
              user_id: userId,
              ticker: trade.ticker,
              company_name: trade.company_name,
              transaction_type: trade.transaction_type,
              transaction_date: trade.transaction_date,
              quantity: trade.quantity,
              price: trade.price,
              fees: trade.fees,
              currency: trade.currency,
              notes: trade.notes,
              moomoo_order_id: trade.moomoo_order_id,
              moomoo_fill_id: trade.moomoo_fill_id,
            });
            count++;
          } catch (err) {
            console.error(`Error inserting trade ${trade.moomoo_fill_id}:`, err);
          }
        }
        return count;
      });

      console.log(`✅ Inserted ${insertedCount} trades into staging`);

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${insertedCount} trades`,
        count: insertedCount,
      });

    } finally {
      service.disconnect();
    }

  } catch (error: any) {
    console.error('❌ Moomoo sync error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync Moomoo trades',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}