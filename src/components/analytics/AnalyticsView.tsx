import React, { useMemo } from 'react';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Zap,
  Layers,
  PieChart as PieIcon,
  BarChart2,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Trade, TradingAccount } from '../../types/trade';
import { calculatePerformanceStats } from '../../utils/calculations';
import { formatCurrency, formatPercent, formatRR } from '../../utils/formatters';
import { RollingNumber } from '../ui/RollingNumber';
import { ScrambleText } from '../ui/ScrambleText';

interface AnalyticsViewProps {
  trades: Trade[];
  activeAccount: TradingAccount | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ trades, activeAccount }) => {
  const startingBal = activeAccount?.initialBalance || 25000;
  const stats = useMemo(() => calculatePerformanceStats(trades, startingBal), [trades, startingBal]);

  // Breakdown by Instrument / Symbol
  const instrumentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; pnl: number; wins: number }> = {};
    trades
      .filter((t) => t.status === 'CLOSED')
      .forEach((t) => {
        if (!map[t.symbol]) map[t.symbol] = { count: 0, pnl: 0, wins: 0 };
        map[t.symbol].count++;
        map[t.symbol].pnl += t.netPnL;
        if (t.netPnL > 0) map[t.symbol].wins++;
      });

    return Object.entries(map).map(([symbol, data]) => ({
      symbol,
      trades: data.count,
      pnl: Number(data.pnl.toFixed(2)),
      winRate: Number(((data.wins / data.count) * 100).toFixed(0)),
    }));
  }, [trades]);

  // Breakdown by Setup / Model
  const setupBreakdown = useMemo(() => {
    const map: Record<string, { count: number; pnl: number; wins: number }> = {};
    trades
      .filter((t) => t.status === 'CLOSED')
      .forEach((t) => {
        const setup = t.setupType || 'Standard';
        if (!map[setup]) map[setup] = { count: 0, pnl: 0, wins: 0 };
        map[setup].count++;
        map[setup].pnl += t.netPnL;
        if (t.netPnL > 0) map[setup].wins++;
      });

    return Object.entries(map).map(([setup, data]) => ({
      setup,
      trades: data.count,
      pnl: Number(data.pnl.toFixed(2)),
      winRate: Number(((data.wins / data.count) * 100).toFixed(0)),
    }));
  }, [trades]);

  // Breakdown by Psychological Emotion Before Entry
  const emotionBreakdown = useMemo(() => {
    const map: Record<string, { count: number; pnl: number; wins: number }> = {};
    trades
      .filter((t) => t.status === 'CLOSED')
      .forEach((t) => {
        const emo = t.emotionBefore || 'CALM';
        if (!map[emo]) map[emo] = { count: 0, pnl: 0, wins: 0 };
        map[emo].count++;
        map[emo].pnl += t.netPnL;
        if (t.netPnL > 0) map[emo].wins++;
      });

    return Object.entries(map).map(([emotion, data]) => ({
      emotion,
      trades: data.count,
      pnl: Number(data.pnl.toFixed(2)),
      winRate: Number(((data.wins / data.count) * 100).toFixed(0)),
    }));
  }, [trades]);

  // Total Fees
  const totalFees = useMemo(() => {
    return trades.reduce((acc, t) => acc + (t.commission || 0) + (t.swap || 0), 0);
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* Sample Size Warning if small sample */}
      {stats.closedTrades < 15 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold block">
              <ScrambleText text="Statistical Sample Size Notice" />
            </span>
            <span className="text-zinc-400">
              You currently have <strong className="text-zinc-200 font-mono"><RollingNumber value={stats.closedTrades} decimals={0} /></strong> closed trades. Standard quantitative significance requires a minimum of 30+ trades before drawing reliable edge conclusions.
            </span>
          </div>
        </div>
      )}

      {/* Institutional Edge Formula Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Expectancy */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
            <ScrambleText text="Expectancy (Edge)" />
          </span>
          <span className="text-xl font-bold font-mono text-zinc-100 block mt-1">
            <RollingNumber value={stats.expectancy} prefix="$" colorCode />
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            <ScrambleText text="Expectancy = (Win% x Avg Win) - (Loss% x Avg Loss)" />
          </p>
        </div>

        {/* Profit Factor */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
            <ScrambleText text="Profit Factor" />
          </span>
          <span className="text-xl font-bold font-mono text-amber-300 block mt-1">
            <RollingNumber value={stats.profitFactor} decimals={2} />
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            Gross Profit (<RollingNumber value={stats.grossProfit} prefix="$" />) / Gross Loss (<RollingNumber value={stats.grossLoss} prefix="$" />)
          </p>
        </div>

        {/* Payoff Ratio */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
            <ScrambleText text="Payoff Ratio" />
          </span>
          <span className="text-xl font-bold font-mono text-zinc-100 block mt-1">
            <RollingNumber value={stats.payoffRatio} decimals={2} suffix=":1" />
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            Avg Win (<RollingNumber value={stats.averageWin} prefix="$" />) / Avg Loss (<RollingNumber value={stats.averageLoss} prefix="$" />)
          </p>
        </div>

        {/* Recovery Factor */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
            <ScrambleText text="Recovery Factor" />
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">
            <RollingNumber value={stats.recoveryFactor} decimals={2} suffix="x" />
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            Net Profit / Max DD Depth (<RollingNumber value={stats.maxDrawdownCash} prefix="$" />)
          </p>
        </div>
      </div>


      {/* Return by Instrument & Setup Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Instrument */}
        <div className="p-5 rounded-2xl bg-[#131313] border border-[#222]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Performance by Instrument
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Asset pair breakdown</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={instrumentBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="symbol" stroke="#555" fontSize={11} tickLine={false} />
                <YAxis stroke="#555" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-xs font-mono">
                          <p className="text-zinc-300 font-bold">{d.symbol}</p>
                          <p className={`mt-0.5 ${d.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Net P&L: {formatCurrency(d.pnl, 'USD', true)}
                          </p>
                          <p className="text-zinc-400 mt-0.5">
                            {d.trades} trades • {d.winRate}% Win Rate
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {instrumentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#D4AF37' : '#F43F5E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Setup Model */}
        <div className="p-5 rounded-2xl bg-[#131313] border border-[#222]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Edge by Setup Model
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Strategy classification</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {setupBreakdown.map((s) => (
              <div
                key={s.setup}
                className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#252525]"
              >
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">{s.setup}</span>
                  <span className="text-[10px] text-zinc-400">
                    {s.trades} trades • {s.winRate}% win rate
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className={`text-xs font-bold ${s.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(s.pnl, 'USD', true)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Psychology Matrix & Execution Friction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Before Entry Matrix */}
        <div className="p-5 rounded-2xl bg-[#131313] border border-[#222]">
          <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2 mb-4">
            <Smile className="w-4 h-4 text-amber-400" />
            Mindset vs Performance Matrix
          </h3>
          <div className="space-y-2.5">
            {emotionBreakdown.map((e) => (
              <div
                key={e.emotion}
                className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#252525]"
              >
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">{e.emotion}</span>
                  <span className="text-[10px] text-zinc-400">
                    {e.trades} executions • {e.winRate}% win rate
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className={`text-xs font-bold ${e.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(e.pnl, 'USD', true)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fees, Commission & Slippage Impact */}
        <div className="p-5 rounded-2xl bg-[#131313] border border-[#222] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Friction & Brokerage Audit
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Realized cost of execution across all recorded operations
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-[#181818] border border-[#262626]">
                <span className="text-[10px] text-zinc-400 block uppercase">Total Commissions & Swaps</span>
                <span className="font-mono text-base font-bold text-zinc-100 mt-1 block">
                  {formatCurrency(totalFees)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#181818] border border-[#262626]">
                <span className="text-[10px] text-zinc-400 block uppercase">Fee Drag on P&L</span>
                <span className="font-mono text-base font-bold text-amber-400 mt-1 block">
                  {stats.grossProfit > 0 ? ((totalFees / stats.grossProfit) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#161616] border border-[#242424] text-[11px] text-zinc-400">
            Institutional brokers typically charge $3.50 per lot per side ($7 round turn). Always verify
            swap rates when swing trading overnight positions.
          </div>
        </div>
      </div>
    </div>
  );
};
