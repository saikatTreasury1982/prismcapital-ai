'use client';

interface Asset {
  typeCode: string;
  typeName: string;
  description: string;
  capitalInvested: number;
  currentValue: number;
  percentage: string;
  tickers: {
    ticker: string;
    tickerName: string;
    capitalInvested: number;
    currentValue: number;
  }[];
}

interface AssetDetailPanelProps {
  asset: Asset | null;
  displayCurrency: string;
  fxRate: number;
}

export default function AssetDetailPanel({ asset, displayCurrency, fxRate }: AssetDetailPanelProps) {
  const formatCurrency = (value: number) => {
    const converted = value * fxRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  if (!asset) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex items-center justify-center min-h-[160px]">
        <p className="text-blue-300 text-sm">Hover a slice or bar to see details</p>
      </div>
    );
  }

  const pnl = asset.currentValue - asset.capitalInvested;
  const pnlPercent = ((pnl / asset.capitalInvested) * 100).toFixed(1);

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      {/* Row 1: asset info + allocation */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10">
        <div className="min-w-0">
          <h4 className="text-white font-bold text-lg">{asset.typeCode}</h4>
          <p className="text-blue-200 text-sm">{asset.typeName}</p>
          {asset.description && (
            <p className="text-blue-300 text-xs mt-0.5">{asset.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-blue-200 text-xs mb-1">Portfolio Allocation</p>
          <p className="text-white font-bold text-2xl">{asset.percentage}%</p>
        </div>
      </div>

      {/* Row 2: capital/value + P/L | holdings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
        <div className="flex gap-5">
          <div>
            <p className="text-blue-300 text-xs mb-1">Capital Invested</p>
            <p className="text-blue-400 font-semibold text-lg mb-3">{formatCurrency(asset.capitalInvested)}</p>
            <p className="text-emerald-300 text-xs mb-1">Current Value</p>
            <p className="text-emerald-400 font-semibold text-lg">{formatCurrency(asset.currentValue)}</p>
          </div>
          <div className="border-l border-white/10 pl-5">
            <p className={`text-xs mb-1 ${pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>Unrealized P/L</p>
            <p className={`font-bold text-lg ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
            </p>
            <p className={`text-xs mt-0.5 ${pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {pnl >= 0 ? '+' : ''}{pnlPercent}%
            </p>
          </div>
        </div>

        {asset.tickers && asset.tickers.length > 0 && (
          <div>
            <p className="text-blue-200 text-xs font-semibold mb-2">Holdings ({asset.tickers.length})</p>
            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
              {asset.tickers.map((ticker, idx) => (
                <div key={idx} className="bg-white/5 rounded p-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold">{ticker.ticker}</p>
                    <p className="text-blue-200 text-[10px] truncate">
                      {ticker.tickerName} · {formatCurrency(ticker.capitalInvested)}
                    </p>
                  </div>
                  <span className="text-emerald-300 text-xs flex-shrink-0">{formatCurrency(ticker.currentValue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}