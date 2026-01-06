import mmWebsocket from 'moomoo-api';
const protoRoot = require('moomoo-api/proto.js');

const { Common, Trd_Common, Qot_Common } = protoRoot;

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface MoomooConfig {
  host: string;
  port: number;
  enableSSL: boolean;
  websocketKey: string;
}

interface MoomooAccount {
  trdEnv: number; // 0=Simulate, 1=Real
  accID: number;
  trdMarketAuthList: number[];
}

interface MomooDeal {
  trdSide: number; // 1=BUY, 2=SELL
  fillID: string;
  fillIDEx: string;
  orderID: string;
  orderIDEx: string;
  code: string;
  name: string;
  qty: number;
  price: number;
  createTime: string;
  counterBrokerID: number;
  counterBrokerName: string;
  secMarket: number; // 1=HK, 2=US, 3=CN_SH, 4=CN_SZ, 5=SG, 6=JP
  status: number;
}

interface MoomooFee {
  orderIDEx: string;
  feeAmount: number;
  feeList: {
    title: string;
    value: number;
  }[];
}

interface StagingTrade {
  ticker: string;
  company_name: string;
  transaction_type: 'BUY' | 'SELL';
  transaction_date: string;
  quantity: number;
  price: number;
  fees: number;
  currency: string;
  notes: string;
  moomoo_order_id: string;
  moomoo_fill_id: string;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Maps Moomoo secMarket code to currency
 */
export function getMoomooMarketCurrency(secMarket: number): string {
  const marketCurrencyMap: { [key: number]: string } = {
    1: 'HKD', // HK
    2: 'USD', // US
    31: 'CNY', // CN_SH
    32: 'CNY', // CN_SZ
    41: 'SGD', // SG
    51: 'JPY', // JP
    61: 'AUD', // AU
    71: 'MYR', // MY
    81: 'CAD', // CA
  };

  return marketCurrencyMap[secMarket] || 'USD';
}

/**
 * Maps Moomoo trdSide to transaction type
 */
export function getMoomooTransactionType(trdSide: number): 'BUY' | 'SELL' {
  // 1=BUY, 2=SELL, 3=SELL_SHORT, 4=BUY_BACK
  return trdSide === 1 || trdSide === 4 ? 'BUY' : 'SELL';
}

/**
 * Formats Moomoo timestamp to YYYY-MM-DD
 */
export function formatMoomooDate(dateTimeString: string): string {
  // Expected format: "2021-09-13 16:45:00.606"
  return dateTimeString.split(' ')[0];
}

// ==========================================
// MOOMOO SERVICE CLASS
// ==========================================

export class MoomooService {
  private websocket: any = null;
  private connected: boolean = false;
  private config: MoomooConfig;

  constructor(config: MoomooConfig) {
    console.log('🏗️ MoomooService constructor called');
    console.log('   Config:', {
      host: config.host,
      port: config.port,
      enableSSL: config.enableSSL,
      websocketKey: config.websocketKey ? `${config.websocketKey.substring(0, 10)}...` : 'MISSING'
    });
    this.config = config;
  }

  /**
   * Connect to Moomoo OpenD API
   */
  async connect(): Promise<void> {
    console.log('🔌 MoomooService.connect() called');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ Connection timeout after 15 seconds');
        console.error('   Please verify:');
        console.error('   1. Moomoo OpenD is running');
        console.error('   2. Shows "Connected" status');
        console.error('   3. WebSocket Port = 33333');
        console.error('   4. WebSocket Auth Key is correct');
        reject(new Error('Connection timeout. Is Moomoo OpenD running and connected?'));
      }, 15000);

      try {
        console.log('📦 Creating mmWebsocket instance...');
        this.websocket = new mmWebsocket();

        // Set up push notification handler
        this.websocket.onPush = (cmd: number, data: any) => {
          console.log('📨 Push notification received:', { cmd, dataType: typeof data });
        };

        // Set up login callback
        this.websocket.onlogin = (ret: number, msg: string) => {
          clearTimeout(timeout);
          console.log('📡 Login callback triggered');
          console.log('   Return code:', ret);
          console.log('   Message:', msg || '(empty)');
          
          if (ret === 0) {
            this.connected = true;
            console.log('✅ Successfully connected to Moomoo OpenD!');
            resolve();
          } else {
            this.connected = false;
            console.error('❌ Login failed');
            console.error('   Code:', ret);
            console.error('   Message:', msg);
            reject(new Error(`Login failed (code ${ret}): ${msg || 'Unknown error'}`));
          }
        };

        console.log('🚀 Starting WebSocket connection...');
        console.log('   Target: ' + this.config.host + ':' + this.config.port);
        console.log('   SSL: ' + this.config.enableSSL);
        console.log('   Key: ' + this.config.websocketKey.substring(0, 10) + '...');

        // Start connection
        this.websocket.start(
          this.config.host,
          this.config.port,
          this.config.enableSSL,
          this.config.websocketKey
        );

        console.log('⏳ Waiting for connection response (15s timeout)...');

      } catch (error: any) {
        clearTimeout(timeout);
        console.error('💥 Exception during connection setup:', error);
        console.error('   Error type:', error.constructor.name);
        console.error('   Error message:', error.message);
        console.error('   Stack:', error.stack);
        reject(new Error(`Connection failed: ${error.message}`));
      }
    });
  }

  /**
   * Get list of trading accounts
   */
  async getAccounts(): Promise<MoomooAccount[]> {
    console.log('📋 Fetching account list...');
    
    if (!this.connected) {
      throw new Error('Not connected to Moomoo API');
    }

    try {
      const response = await this.websocket.GetAccList({
        c2s: { userID: 0 },
      });

      const accounts = response.s2c.accList || [];
      console.log(`✅ Found ${accounts.length} accounts`);
      
      return accounts;
    } catch (error: any) {
      console.error('❌ Failed to get accounts:', error);
      throw error;
    }
  }

  /**
   * Fetch historical trades (deals) for an account
   */
  async fetchTrades(
    account: MoomooAccount,
    beginTime: string,
    endTime: string
  ): Promise<MomooDeal[]> {
    console.log(`📊 Fetching trades for account ${account.accID}`);
    console.log(`   Date range: ${beginTime} to ${endTime}`);
    
    if (!this.connected) {
      throw new Error('Not connected to Moomoo API');
    }

    try {
      const req = {
        c2s: {
          header: {
            trdEnv: account.trdEnv,
            accID: account.accID,
            trdMarket: Trd_Common.TrdMarket.TrdMarket_US, // US market
          },
          filterConditions: {
            beginTime,
            endTime,
          },
        },
      };

      console.log('   Sending request to GetHistoryOrderFillList...');
      const response = await this.websocket.GetHistoryOrderFillList(req);

      const trades = response.s2c.orderFillList || [];
      console.log(`✅ Fetched ${trades.length} trades`);

      return trades;
    } catch (error: any) {
      console.error('❌ Failed to fetch trades:', error);
      throw error;
    }
  }

  /**
   * Fetch fees for multiple orders (max 400 per request)
   */
  async fetchFees(
    account: MoomooAccount,
    orderIDExList: string[]
  ): Promise<MoomooFee[]> {
    console.log(`💰 Fetching fees for ${orderIDExList.length} orders`);
    
    if (!this.connected) {
      throw new Error('Not connected to Moomoo API');
    }

    // Split into chunks of 400 (API limit)
    const chunks: string[][] = [];
    for (let i = 0; i < orderIDExList.length; i += 400) {
      chunks.push(orderIDExList.slice(i, i + 400));
    }

    console.log(`   Split into ${chunks.length} chunks (max 400 per chunk)`);

    const allFees: MoomooFee[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`   Fetching chunk ${i + 1}/${chunks.length} (${chunk.length} orders)...`);
      
      try {
        const req = {
          c2s: {
            header: {
              trdEnv: account.trdEnv,
              accID: account.accID,
              trdMarket: Trd_Common.TrdMarket.TrdMarket_US,
            },
            orderIdExList: chunk,
          },
        };

        const response = await this.websocket.GetOrderFee(req);
        const fees = response.s2c.orderFeeList || [];
        allFees.push(...fees);
        console.log(`   ✅ Chunk ${i + 1}: ${fees.length} fees retrieved`);
      } catch (error: any) {
        console.error(`   ❌ Failed to fetch fees for chunk ${i + 1}:`, error);
        // Continue with other chunks
      }
    }

    console.log(`✅ Total fees fetched: ${allFees.length}`);
    return allFees;
  }

  /**
   * Convert Moomoo deals to staging format
   */
  convertDealsToStaging(deals: MomooDeal[], fees: MoomooFee[]): StagingTrade[] {
    console.log(`🔄 Converting ${deals.length} deals to staging format...`);
    
    // Create a fee lookup map
    const feeMap = new Map<string, number>();
    fees.forEach((fee) => {
      feeMap.set(fee.orderIDEx, fee.feeAmount || 0);
    });

    const stagingTrades = deals.map((deal) => ({
      ticker: deal.code,
      company_name: deal.name || '',
      transaction_type: getMoomooTransactionType(deal.trdSide),
      transaction_date: formatMoomooDate(deal.createTime),
      quantity: deal.qty,
      price: deal.price,
      fees: feeMap.get(deal.orderIDEx) || 0,
      currency: getMoomooMarketCurrency(deal.secMarket),
      notes: `Moomoo Import - Fill ID: ${deal.fillIDEx}`,
      moomoo_order_id: deal.orderIDEx,
      moomoo_fill_id: deal.fillIDEx,
    }));

    console.log(`✅ Converted ${stagingTrades.length} trades`);
    return stagingTrades;
  }

  /**
   * Disconnect from Moomoo API
   */
  disconnect(): void {
    console.log('🔌 Disconnecting from Moomoo OpenD...');
    
    if (this.websocket) {
      this.websocket.stop();
      this.connected = false;
      console.log('✅ Disconnected successfully');
    } else {
      console.log('   (No active connection to disconnect)');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}