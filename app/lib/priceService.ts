export async function fetchCurrentPrice(ticker: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch price for ${ticker}`);
      return null;
    }
    
    const data = await response.json();
    const quote = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    
    if (quote) {
      return parseFloat(quote);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return null;
  }
}