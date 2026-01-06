/**
 * Moomoo OpenD Service
 * Client-side service to interact with Moomoo OpenD API
 */

interface MoomooConfig {
  ip: string;
  port: number;
  apiKey: string;
}

interface MomooDeal {
  trd_side: number; // 1=BUY, 2=SELL
  code: string; // Ticker
  name: string; // Company name
  qty: number;
  price: number;
  create_time: string; // Unix timestamp or date string
  order_id: string;
  deal_id: string;
  trd_market: number; // Market code
}

interface MoomooFee {
  order_id: string;
  fee_amount: number;
}

export class MoomooService {
  private config: MoomooConfig;
  private ws: WebSocket | null = null;

  constructor(config: MoomooConfig) {
    this.config = config;
  }

  /**
   * Connect to Moomoo OpenD WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://${this.config.ip}:${this.config.port}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Connected to Moomoo OpenD');
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(new Error('Failed to connect to Moomoo OpenD. Make sure OpenD is running.'));
        };

        this.ws.onclose = () => {
          console.log('Disconnected from Moomoo OpenD');
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout. Is Moomoo OpenD running?'));
          }
        }, 5000);
      } catch (error: any) {
        reject(error);
      }
    });
  }

  /**
   * Fetch trade history from Moomoo
   */
  async fetchTrades(startDate: string, endDate: string): Promise<MomooDeal[]> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Moomoo OpenD');
    }

    // TODO: Implement actual Moomoo API call
    // This is a placeholder that simulates the response
    console.log('Fetching trades from', startDate, 'to', endDate);
    
    // For now, return mock data to test the flow
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            trd_side: 1,
            code: 'AAPL',
            name: 'Apple Inc.',
            qty: 10,
            price: 150.50,
            create_time: '2026-01-05',
            order_id: 'order_123',
            deal_id: 'deal_456',
            trd_market: 2 // USD market
          }
        ]);
      }, 1000);
    });
  }

  /**
   * Fetch fees for orders
   */
  async fetchFees(orderIds: string[]): Promise<MoomooFee[]> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Moomoo OpenD');
    }

    // TODO: Implement actual fee API call
    console.log('Fetching fees for orders:', orderIds);
    
    // Mock fees
    return orderIds.map(orderId => ({
      order_id: orderId,
      fee_amount: 1.50
    }));
  }

  /**
   * Disconnect from Moomoo OpenD
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * Map Moomoo market code to currency
 */
export function getMoomooMarketCurrency(marketCode: number): string {
  switch (marketCode) {
    case 1: return 'HKD'; // Hong Kong
    case 2: return 'USD'; // US
    case 3: return 'CNY'; // China
    case 4: return 'SGD'; // Singapore
    case 5: return 'AUD'; // Australia
    default: return 'USD';
  }
}

/**
 * Map Moomoo trade side to transaction type ID
 */
export function getMoomooTransactionType(trdSide: number): number {
  return trdSide === 1 ? 1 : 2; // 1=BUY, 2=SELL
}