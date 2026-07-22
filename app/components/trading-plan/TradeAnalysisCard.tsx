'use client';

import { useState } from 'react';
import { Flag, Trash2, Edit, Archive, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { TradeAnalysis } from '@/app/lib/types/tradeAnalysis';
import { TickerMarketData } from '@/app/services/marketServiceClient';
import { updateTradeAnalysis } from '@/app/services/tradeAnalysisServiceClient';
import BulletDisplay from '@/app/lib/ui/BulletDisplay';

interface TradeAnalysisCardProps {
  analysis: TradeAnalysis;
  marketData?: TickerMarketData | null;
  marketLoading?: boolean;
  onEdit: (analysis: TradeAnalysis) => void;
  onDelete: (analysisId: number) => void;
  onUpdate: () => void;
}

/** Tiny inline sparkline built from daily closes. */
function Sparkline({ values }: { values: number[] }) {
  if (!values || values.length < 2) return null;

  const w = 110;
  const h = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const up = values[values.length - 1] >= values[0];
  const stroke = up ? '#34d399' : '#fb7185';
  const fillId = `spark-${up ? 'up' : 'down'}`;
  const line = `M${points.join(' L')}`;
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-none">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? 'rgba(52,211,153,0.35)' : 'rgba(251,113,133,0.35)'} />
          <stop offset="100%" stopColor={up ? 'rgba(52,211,153,0)' : 'rgba(251,113,133,0)'} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function TradeAnalysisCard({
  analysis,
  marketData,
  marketLoading,
  onEdit,
  onDelete,
  onUpdate,
}: TradeAnalysisCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleFlag = async () => {
    setIsUpdating(true);
    try {
      await updateTradeAnalysis(analysis.analysis_id, {
        is_flagged: analysis.is_flagged === 1 ? 0 : 1,
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleArchive = async () => {
    setIsUpdating(true);
    try {
      await updateTradeAnalysis(analysis.analysis_id, {
        status: analysis.status === 'ARCHIVED' ? 'ANALYZING' : 'ARCHIVED',
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRRColor = () => {
    const ratio = analysis.risk_reward_ratio || 0;
    if (ratio >= 2) return 'text-green-400';
    if (ratio >= 1) return 'text-yellow-400';
    return 'text-rose-400';
  };

  // ----- derived market values -----
  const price = marketData?.price ?? null;
  const changePct = marketData?.changePercent ?? null;
  const hi52 = marketData?.week52High ?? null;
  const lo52 = marketData?.week52Low ?? null;
  const pe = marketData?.peForward ?? null;

  const entryLow =
    analysis.entry_type === 'RANGE' && analysis.entry_low != null ? analysis.entry_low : analysis.entry_price;
  const entryHigh =
    analysis.entry_type === 'RANGE' && analysis.entry_high != null ? analysis.entry_high : analysis.entry_price;

  const offHighPct = price != null && hi52 ? ((hi52 - price) / hi52) * 100 : null;
  const aboveLowPct = price != null && lo52 ? ((price - lo52) / lo52) * 100 : null;
  const rangePos = price != null && hi52 != null && lo52 != null && hi52 > lo52
    ? ((price - lo52) / (hi52 - lo52)) * 100
    : null;

  // plan gauge only when both SL and TP exist
  const hasPlanGauge = analysis.stop_loss != null && analysis.take_profit != null;

  const pct = (v: number, min: number, max: number) =>
    max > min ? Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100)) : 50;

  // plan gauge scale: pad 8% beyond SL/TP so an out-of-plan price stays visible
  let planMin = 0, planMax = 0;
  if (hasPlanGauge) {
    const lo = Math.min(analysis.stop_loss!, entryLow, price ?? entryLow);
    const hi = Math.max(analysis.take_profit!, entryHigh, price ?? entryHigh);
    const pad = (hi - lo) * 0.08;
    planMin = lo - pad;
    planMax = hi + pad;
  }

  const entryVerdict = (() => {
    if (price == null) return null;
    if (price < entryLow) {
      return { text: `${(((entryLow - price) / entryLow) * 100).toFixed(1)}% below entry zone`, cls: 'text-emerald-400' };
    }
    if (price > entryHigh) {
      return { text: `${(((price - entryHigh) / entryHigh) * 100).toFixed(1)}% above entry zone`, cls: 'text-rose-400' };
    }
    return { text: 'In entry zone', cls: 'text-amber-400' };
  })();

  const money = (v: number | null | undefined, dp = 2) =>
    v == null ? '—' : `$${v.toFixed(dp)}`;

  return (
    <div
      className={`backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/20 transition-all ${
        analysis.is_flagged === 1 ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-500/20' : ''
      }`}
    >
      {/* ---------- HEADER LINE 1 ---------- */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full bg-white/10 text-blue-300 hover:bg-white/20 transition-all flex-shrink-0"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-white leading-tight">{analysis.ticker}</h3>
            {analysis.exchange_code && (
              <span className="text-[10px] text-blue-300 uppercase tracking-wider">{analysis.exchange_code}</span>
            )}
            {analysis.status === 'ARCHIVED' && (
              <span className="text-[10px] px-2 py-0.5 bg-slate-500/20 text-slate-300 rounded-full inline-block ml-2">
                Archived
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={toggleFlag}
            disabled={isUpdating}
            className={`p-2 rounded-full transition-all ${
              analysis.is_flagged === 1 ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/10 text-blue-300 hover:bg-white/20'
            }`}
            title={analysis.is_flagged === 1 ? 'Unflag' : 'Flag for trading'}
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                alert('Please use desktop to edit positions');
                return;
              }
              onEdit(analysis);
            }}
            className="p-2 rounded-full bg-white/10 text-blue-300 hover:bg-white/20 transition-all"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleArchive}
            disabled={isUpdating}
            className="p-2 rounded-full bg-white/10 text-blue-300 hover:bg-white/20 transition-all"
            title={analysis.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(analysis.analysis_id)}
            className="p-2 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* price + sparkline */}
      <div className="flex items-center gap-3 mt-2">
        {marketLoading && price == null ? (
          <span className="text-blue-300 text-sm">Loading market data…</span>
        ) : (
          <>
            <span className="text-lg font-bold text-white">{money(price)}</span>
            {changePct != null && (
              <span className={`text-xs font-semibold ${changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {changePct >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(changePct).toFixed(2)}%
              </span>
            )}
            <span className="flex-1 flex justify-end">
              <Sparkline values={marketData?.sparkline ?? []} />
            </span>
          </>
        )}
      </div>

      {/* ---------- HEADER LINE 2: market metrics ---------- */}
      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/10">
        <div className="min-w-0">
          <p className="text-[9.5px] text-slate-400 uppercase tracking-wider whitespace-nowrap">52W High</p>
          <p className="text-[13px] font-bold text-white whitespace-nowrap">{money(hi52)}</p>
          {offHighPct != null && (
            <p className="text-[9.5px] text-rose-400 whitespace-nowrap">{'\u25BC'} {offHighPct.toFixed(1)}% off</p>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[9.5px] text-slate-400 uppercase tracking-wider whitespace-nowrap">52W Low</p>
          <p className="text-[13px] font-bold text-white whitespace-nowrap">{money(lo52)}</p>
          {aboveLowPct != null && (
            <p className="text-[9.5px] text-emerald-400 whitespace-nowrap">{'\u25B2'} {aboveLowPct.toFixed(1)}% up</p>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[9.5px] text-slate-400 uppercase tracking-wider whitespace-nowrap">P/E FWD</p>
          <p className="text-[13px] font-bold text-white whitespace-nowrap">{pe != null ? pe.toFixed(1) : '—'}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[9.5px] text-slate-400 uppercase tracking-wider whitespace-nowrap">52W Range</p>
          <p className="text-[13px] font-bold text-white whitespace-nowrap">
            {rangePos != null ? `${rangePos.toFixed(0)}%` : '—'}
          </p>
          <p className="text-[9.5px] text-slate-400 whitespace-nowrap">of band</p>
        </div>
      </div>

      {/* ---------- COLLAPSIBLE ---------- */}
      {isExpanded && (
        <>
          {/* GAUGE 1: price vs plan */}
          {hasPlanGauge && price != null && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-[10px] text-blue-300 uppercase tracking-wider font-semibold">Price vs Your Plan</span>
                {entryVerdict && <span className={`text-[11px] font-bold ${entryVerdict.cls}`}>{entryVerdict.text}</span>}
              </div>
              <div className="relative h-1.5 rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 rounded-full bg-gradient-to-r from-emerald-400/45 to-emerald-400/75"
                  style={{
                    left: `${pct(entryLow, planMin, planMax)}%`,
                    width: `${Math.max(2, pct(entryHigh, planMin, planMax) - pct(entryLow, planMin, planMax))}%`,
                  }}
                />
                <div
                  className="absolute -top-[5px] w-0.5 h-4 rounded bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]"
                  style={{ left: `${pct(analysis.stop_loss!, planMin, planMax)}%` }}
                />
                <div
                  className="absolute -top-[5px] w-0.5 h-4 rounded bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                  style={{ left: `${pct(analysis.take_profit!, planMin, planMax)}%` }}
                />
                <div
                  className="absolute -top-[5px] w-0.5 h-4 rounded bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)]"
                  style={{ left: `${pct(price, planMin, planMax)}%` }}
                />
              </div>
              <div className="relative h-5 mt-2">
                <span
                  className="absolute -translate-x-1/2 whitespace-nowrap bg-white/15 border border-white/25 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ left: `${pct(price, planMin, planMax)}%` }}
                >
                  {money(price)}
                </span>
              </div>
              <div className="flex justify-between text-[9.5px] text-slate-400">
                <span>SL {money(analysis.stop_loss)}</span>
                <span>Entry {money(entryLow)}–{money(entryHigh)}</span>
                <span>TP {money(analysis.take_profit)}</span>
              </div>
            </div>
          )}

          {/* GAUGE 2: price vs 52-week range */}
          {price != null && hi52 != null && lo52 != null && hi52 > lo52 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-[10px] text-blue-300 uppercase tracking-wider font-semibold">Price vs 52-Week Range</span>
                <span className={`text-[11px] font-bold ${rangePos! >= 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {rangePos! >= 50
                    ? `${offHighPct?.toFixed(1)}% off high`
                    : `${aboveLowPct?.toFixed(1)}% above low`}
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-gradient-to-r from-emerald-400/25 via-amber-400/25 to-rose-400/25">
                <div
                  className="absolute inset-y-0 rounded-full bg-blue-400/60"
                  style={{
                    left: `${pct(entryLow, lo52, hi52)}%`,
                    width: `${Math.max(2, pct(entryHigh, lo52, hi52) - pct(entryLow, lo52, hi52))}%`,
                  }}
                />
                <div
                  className="absolute -top-[5px] w-0.5 h-4 rounded bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)]"
                  style={{ left: `${pct(price, lo52, hi52)}%` }}
                />
              </div>
              <div className="relative h-5 mt-2">
                <span
                  className="absolute -translate-x-1/2 whitespace-nowrap bg-white/15 border border-white/25 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ left: `${pct(price, lo52, hi52)}%` }}
                >
                  {money(price)}
                </span>
              </div>
              <div className="flex justify-between text-[9.5px] text-slate-400">
                <span>52W Low {money(lo52)}</span>
                <span>52W High {money(hi52)}</span>
              </div>
              <div className="flex gap-3 mt-2 text-[9.5px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-1 rounded bg-blue-400/60" />
                  Your entry zone
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-1 rounded bg-white" />
                  Current price
                </span>
              </div>
            </div>
          )}

          {/* ---------- PLAN FIELDS ---------- */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <p className="text-[9.5px] text-blue-300 uppercase tracking-wide mb-0.5">
                {analysis.entry_type === 'RANGE' ? 'Entry Range' : 'Entry Price'}
              </p>
              <p className="text-sm font-bold text-white whitespace-nowrap">
                {analysis.entry_type === 'RANGE' && analysis.entry_low != null && analysis.entry_high != null
                  ? `${money(analysis.entry_low)} – ${money(analysis.entry_high)}`
                  : money(analysis.entry_price)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <p className="text-[9.5px] text-blue-300 uppercase tracking-wide mb-0.5">Position Size</p>
              <p className="text-sm font-bold text-white whitespace-nowrap">${analysis.position_size.toFixed(0)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <p className="text-[9.5px] text-rose-300 uppercase tracking-wide mb-0.5">Stop Loss</p>
              <p className="text-sm font-bold text-white whitespace-nowrap">{money(analysis.stop_loss)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <p className="text-[9.5px] text-green-300 uppercase tracking-wide mb-0.5">Take Profit</p>
              <p className="text-sm font-bold text-white whitespace-nowrap">{money(analysis.take_profit)}</p>
            </div>
          </div>

          {/* ---------- FOOTER STATS ---------- */}
          <div className="border-t border-white/15 mt-4 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-blue-200 text-xs">Shares to Buy</span>
              <span className="text-white font-semibold text-xs">
                {analysis.entry_type === 'RANGE' && analysis.entry_low != null && analysis.entry_high != null
                  ? `${(analysis.position_size / analysis.entry_low).toFixed(2)} – ${(analysis.position_size / analysis.entry_high).toFixed(2)}`
                  : analysis.shares_to_buy?.toFixed(2) ?? '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-rose-200 text-xs flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Risk %
              </span>
              <span className="text-rose-400 font-bold text-sm">{analysis.risk_percentage?.toFixed(2) || 0}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-green-200 text-xs flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Reward %
              </span>
              <span className="text-green-400 font-bold text-sm">{analysis.reward_percentage?.toFixed(2) || 0}%</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-blue-200 text-xs">R:R Ratio</span>
              <span className={`font-bold text-base ${getRRColor()}`}>
                {analysis.entry_type === 'RANGE' && analysis.risk_reward_ratio_low && analysis.risk_reward_ratio_high
                  ? `1:${analysis.risk_reward_ratio_low.toFixed(2)} → 1:${analysis.risk_reward_ratio_high.toFixed(2)}`
                  : analysis.risk_reward_ratio && analysis.risk_reward_ratio > 0
                    ? `1:${analysis.risk_reward_ratio.toFixed(2)}`
                    : '-'}
              </span>
            </div>
          </div>

          {/* ---------- NOTES ---------- */}
          {analysis.notes && (
            <div className="mt-4 pt-3 border-t border-white/15">
              <p className="text-[9.5px] text-blue-300 uppercase tracking-wide mb-1">Notes</p>
              <div className="text-white text-xs">
                <BulletDisplay text={analysis.notes} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}