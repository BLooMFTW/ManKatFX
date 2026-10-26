import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  RotateCcw,
  Download,
  Filter,
  ArrowDownRight,
  Trash2,
  ExternalLink,
  Target,
  TrendingUp,
  Percent,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BacktestTrade } from '../../types/trade';
import { RollingNumber } from '../ui/RollingNumber';
import { ScrambleText } from '../ui/ScrambleText';
import { Badge } from '../ui/Badge';
import { ConfirmModal } from '../ui/ConfirmModal';
import { BacktestModal } from './BacktestModal';
import { formatDate } from '../../utils/formatters';

interface BacktestViewProps {
  backtests: BacktestTrade[];
  onSaveBacktest: (trade: BacktestTrade) => Promise<void>;
  onDeleteBacktest: (tradeId: string) => Promise<void>;
  onResetBacktests: () => Promise<void>;
  userId: string;
}

export const BacktestView: React.FC<BacktestViewProps> = ({
  backtests,
  onSaveBacktest,
  onDeleteBacktest,
  onResetBacktests,
  userId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [selectedPair, setSelectedPair] = useState<string>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('ALL');

  const filterTriggerKey = `${selectedPair}_${selectedTimeframe}_${selectedOutcome}_${backtests.length}`;

  // Unique lists for dropdowns
  const availablePairs = useMemo(() => {
    const set = new Set(backtests.map((b) => b.pair));
    return Array.from(set).sort();
  }, [backtests]);

  const filtered = useMemo(() => {
    return backtests.filter((b) => {
      if (selectedPair !== 'ALL' && b.pair !== selectedPair) return false;
      if (selectedTimeframe !== 'ALL' && b.timeframe !== selectedTimeframe) return false;
      if (selectedOutcome !== 'ALL' && b.outcome !== selectedOutcome) return false;
      return true;
    });
  }, [backtests, selectedPair, selectedTimeframe, selectedOutcome]);

  // Analytics Report Calculations
  const stats = useMemo(() => {
    const total = filtered.length;
    if (total === 0) {
      return {
        total: 0,
        wins: 0,
        losses: 0,
        be: 0,
        winRate: 0,
        totalR: 0,
        profitFactor: 0,
        expectancy: 0,
        maxDrawdownR: 0,
        avgWinR: 0,
        avgLossR: 0,
      };
    }

    let wins = 0;
    let losses = 0;
    let be = 0;
    let winRSum = 0;
    let lossRSum = 0;
    let totalR = 0;

    let peakR = 0;
    let runningR = 0;
    let maxDDR = 0;

    // Chronological order for drawdown
    const chronological = [...filtered].sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    chronological.forEach((b) => {
      const r = b.realizedRR || 0;
      totalR += r;
      runningR += r;
      if (runningR > peakR) peakR = runningR;
      const dd = peakR - runningR;
      if (dd > maxDDR) maxDDR = dd;

      if (b.outcome === 'WIN') {
        wins++;
        winRSum += r;
      } else if (b.outcome === 'LOSS') {
        losses++;
        lossRSum += Math.abs(r);
      } else {
        be++;
      }
    });

    const winRate = total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0;
    const profitFactor =
      lossRSum > 0 ? Number((winRSum / lossRSum).toFixed(2)) : winRSum > 0 ? 99 : 0;
    const expectancy = total > 0 ? Number((totalR / total).toFixed(2)) : 0;
    const avgWinR = wins > 0 ? Number((winRSum / wins).toFixed(2)) : 0;
    const avgLossR = losses > 0 ? Number((lossRSum / losses).toFixed(2)) : 0;

    return {
      total,
      wins,
      losses,
      be,
      winRate,
      totalR: Number(totalR.toFixed(2)),
      profitFactor,
      expectancy,
      maxDrawdownR: Number(maxDDR.toFixed(2)),
      avgWinR,
      avgLossR,
    };
  }, [filtered]);

  // Equity Curve Data (Cumulative R return over time)
  const equityCurveData = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    let cumR = 0;
    const points = [{ index: 0, date: 'Start', cumR: 0, r: 0 }];

    sorted.forEach((trade, i) => {
      cumR += trade.realizedRR || 0;
      points.push({
        index: i + 1,
        date: trade.entryDate.substring(5), // MM-DD
        cumR: Number(cumR.toFixed(2)),
        r: trade.realizedRR || 0,
      });
    });

    return points;
  }, [filtered]);

  // Performance by Pair
  const pairPerformance = useMemo(() => {
    const map: Record<string, { total: number; wins: number; totalR: number }> = {};
    filtered.forEach((b) => {
      if (!map[b.pair]) map[b.pair] = { total: 0, wins: 0, totalR: 0 };
      map[b.pair].total++;
      if (b.outcome === 'WIN') map[b.pair].wins++;
      map[b.pair].totalR += b.realizedRR || 0;
    });

    return Object.entries(map)
      .map(([pair, d]) => ({
        pair,
        total: d.total,
        winRate: Number(((d.wins / d.total) * 100).toFixed(0)),
        totalR: Number(d.totalR.toFixed(2)),
      }))
      .sort((a, b) => b.totalR - a.totalR);
  }, [filtered]);

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Pair',
      'Direction',
      'Timeframe',
      'Entry Date',
      'Entry Price',
      'Exit Price',
      'Stop Loss',
      'Take Profit',
      'Planned R',
      'Realized R',
      'Outcome',
      'Strategy',
      'Notes',
    ];
    const rows = filtered.map((t) => [
      t.pair,
      t.direction,
      t.timeframe,
      t.entryDate,
      t.entryPrice,
      t.exitPrice,
      t.stopLoss,
      t.takeProfit,
      t.plannedRR,
      t.realizedRR,
      t.outcome,
      `"${(t.strategy || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ManKatFx_Backtests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 sm:p-5 rounded-2xl bg-[#121212] border border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              <ScrambleText text="Institutional Backtesting Suite" triggerKey={filterTriggerKey} />
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ScrambleText text="Live Sync" />
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            <ScrambleText text="Simulate setups across historical price action, quantify system edge, and inspect equity curve data." />
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {backtests.length > 0 && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                <ScrambleText text="Reset Data" />
              </span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#181818] border border-[#282828] text-zinc-300 hover:text-zinc-100 text-xs font-semibold transition disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">
              <ScrambleText text="Export CSV" />
            </span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-extrabold text-xs shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>
              <ScrambleText text="Log Backtest Trade" />
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards Report Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Return in R */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424] relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Total Return" triggerKey={filterTriggerKey} />
            </span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono">
            <RollingNumber
              value={stats.totalR}
              prefix={stats.totalR >= 0 ? '+' : ''}
              suffix="R"
              colorCode
              triggerKey={filterTriggerKey}
            />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            <ScrambleText text="Cumulative Yield" />
          </span>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Win Rate" triggerKey={filterTriggerKey} />
            </span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-100">
            <RollingNumber value={stats.winRate} suffix="%" triggerKey={filterTriggerKey} />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
            <RollingNumber value={stats.wins} decimals={0} triggerKey={filterTriggerKey} />W /{' '}
            <RollingNumber value={stats.losses} decimals={0} triggerKey={filterTriggerKey} />L /{' '}
            <RollingNumber value={stats.be} decimals={0} triggerKey={filterTriggerKey} />BE
          </span>
        </div>

        {/* Profit Factor */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Profit Factor" triggerKey={filterTriggerKey} />
            </span>
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-100">
            <RollingNumber value={stats.profitFactor} decimals={2} triggerKey={filterTriggerKey} />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            <ScrambleText text="Gross Win / Loss" />
          </span>
        </div>

        {/* Expectancy */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Expectancy" triggerKey={filterTriggerKey} />
            </span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono">
            <RollingNumber
              value={stats.expectancy}
              prefix={stats.expectancy >= 0 ? '+' : ''}
              suffix="R"
              colorCode
              triggerKey={filterTriggerKey}
            />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            <ScrambleText text="Avg R / Trade" />
          </span>
        </div>

        {/* Max Drawdown */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Max Drawdown" triggerKey={filterTriggerKey} />
            </span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            <RollingNumber value={stats.maxDrawdownR} prefix="-" suffix="R" triggerKey={filterTriggerKey} />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            <ScrambleText text="Peak-to-trough decline" />
          </span>
        </div>

        {/* Total Sample */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Sample Size" triggerKey={filterTriggerKey} />
            </span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-100">
            <RollingNumber value={stats.total} decimals={0} triggerKey={filterTriggerKey} />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            <ScrambleText text="Tested executions" />
          </span>
        </div>
      </div>

      {/* Equity Curve Graph & Pair Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative R Growth Chart */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#131313] border border-[#222222]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">
                <ScrambleText text="Cumulative R Equity Curve" triggerKey={filterTriggerKey} />
              </h2>
              <p className="text-[11px] text-zinc-400">
                <ScrambleText text="Performance trajectory in multiples of risk (R)" />
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-amber-400">
              <RollingNumber
                value={stats.totalR}
                prefix={stats.totalR >= 0 ? '+' : ''}
                suffix="R"
                triggerKey={filterTriggerKey}
              />
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="backtestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#666"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `${v}R`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181818',
                    borderColor: '#2A2A2A',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: any) => [`${val}R`, 'Cumulative Return']}
                />
                <Area
                  type="monotone"
                  dataKey="cumR"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#backtestGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pair Performance Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131313] border border-[#222222] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 tracking-tight mb-1">
              <ScrambleText text="Performance by Instrument" triggerKey={filterTriggerKey} />
            </h2>
            <p className="text-[11px] text-zinc-400 mb-4">
              <ScrambleText text="Win rate & R yield per tested asset" />
            </p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {pairPerformance.map((item) => (
                <div
                  key={item.pair}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#171717] border border-[#242424] text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-zinc-100">{item.pair}</span>
                    <span className="text-[10px] text-zinc-400 block font-sans">
                      <RollingNumber value={item.total} decimals={0} triggerKey={filterTriggerKey} /> trades (
                      <RollingNumber value={item.winRate} suffix="%" decimals={0} triggerKey={filterTriggerKey} /> Win)
                    </span>
                  </div>
                  <span className="font-bold">
                    <RollingNumber
                      value={item.totalR}
                      prefix={item.totalR >= 0 ? '+' : ''}
                      suffix="R"
                      colorCode
                      triggerKey={filterTriggerKey}
                    />
                  </span>
                </div>
              ))}

              {pairPerformance.length === 0 && (
                <div className="text-center py-10 text-zinc-400 text-xs">
                  <ScrambleText text="No backtest data recorded yet." />
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1F1F1F] text-[11px] text-zinc-400 flex items-center justify-between">
            <span>
              <ScrambleText text="Expectancy Edge" />
            </span>
            <span className="text-amber-400 font-mono font-bold">
              <RollingNumber
                value={stats.expectancy}
                prefix={stats.expectancy >= 0 ? '+' : ''}
                suffix="R / trade"
                triggerKey={filterTriggerKey}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Data Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#121212] border border-[#222]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-300">
              <ScrambleText text="Filter Log:" />
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Pair filter */}
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="bg-[#181818] border border-[#2A2A2A] text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="ALL">All Pairs</option>
              {availablePairs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Timeframe filter */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-[#181818] border border-[#2A2A2A] text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="ALL">All Timeframes</option>
              {['1m', '5m', '15m', '1H', '4H', 'Daily'].map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>

            {/* Outcome filter */}
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="bg-[#181818] border border-[#2A2A2A] text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="ALL">All Outcomes</option>
              <option value="WIN">Wins Only</option>
              <option value="LOSS">Losses Only</option>
              <option value="BE">Break-Even</option>
            </select>
          </div>
        </div>

        {/* Backtests Table */}
        <div className="rounded-2xl bg-[#131313] border border-[#222222] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#181818] border-b border-[#242424] text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">
                    <ScrambleText text="Date" />
                  </th>
                  <th className="py-3 px-4">
                    <ScrambleText text="Pair" />
                  </th>
                  <th className="py-3 px-4">
                    <ScrambleText text="Timeframe" />
                  </th>
                  <th className="py-3 px-4">
                    <ScrambleText text="Direction" />
                  </th>
                  <th className="py-3 px-4">
                    <ScrambleText text="Entry / Exit" />
                  </th>
                  <th className="py-3 px-4">
                    <ScrambleText text="SL / TP" />
                  </th>
                  <th className="py-3 px-4">
                    <ScrambleText text="Planned R" />
                  </th>
                  <th className="py-3 px-4">
                    <ScrambleText text="Realized R" />
                  </th>
                  <th className="py-3 px-4">
                    <ScrambleText text="Outcome" />
                  </th>
                  <th className="py-3 px-4">
                    <ScrambleText text="Strategy & Notes" />
                  </th>
                  <th className="py-3 px-4 text-right">
                    <ScrambleText text="Action" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-[#181818]/60 transition">
                    <td className="py-3 px-4 font-mono text-zinc-300">{formatDate(b.entryDate)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-zinc-100">{b.pair}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{b.timeframe}</td>
                    <td className="py-3 px-4">
                      <Badge variant={b.direction === 'LONG' ? 'green' : 'red'} size="sm">
                        {b.direction}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      <div>{b.entryPrice}</div>
                      <div className="text-[10px] text-zinc-400">{b.exitPrice}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      <div>SL: {b.stopLoss}</div>
                      <div className="text-[10px]">TP: {b.takeProfit}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-300">
                      <RollingNumber value={b.plannedRR} suffix="R" decimals={1} />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <RollingNumber
                        value={b.realizedRR}
                        prefix={b.realizedRR > 0 ? '+' : ''}
                        suffix="R"
                        decimals={2}
                        colorCode
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={b.outcome === 'WIN' ? 'green' : b.outcome === 'LOSS' ? 'red' : 'zinc'}
                        size="sm"
                      >
                        {b.outcome}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 max-w-[180px]">
                      <span className="block font-medium text-zinc-200 truncate">
                        {b.strategy || 'Discretionary'}
                      </span>
                      {b.notes && <span className="block text-[10px] text-zinc-400 truncate">{b.notes}</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.screenshotUrl && (
                          <a
                            href={b.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition"
                            title="View Chart"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setDeletingId(b.id)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                          title="Delete Backtest Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-sm font-semibold text-zinc-300">
                <ScrambleText text="No backtest records logged" />
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                <ScrambleText text="Simulate your first trading setup to generate institutional edge analytics." />
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
              >
                <ScrambleText text="+ Log First Backtest Trade" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log Backtest Modal */}
      <BacktestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveBacktest}
        userId={userId}
      />

      {/* Reset Backtest Data Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={onResetBacktests}
        title="Reset All Backtest Data"
        message="Are you sure you want to permanently reset and delete all historical backtest logs for this account? This cannot be undone."
        confirmText="Reset All Backtest Data"
        isDestructive={true}
      />

      {/* Single Trade Deletion Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            onDeleteBacktest(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Backtest Trade"
        message="Are you sure you want to delete this backtest execution record?"
        confirmText="Delete Record"
        isDestructive={true}
      />
    </div>
  );
};
