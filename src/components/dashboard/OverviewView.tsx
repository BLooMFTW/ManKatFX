import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Award,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
import { calculatePerformanceStats, calculateEquityCurve } from '../../utils/calculations';
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters';
import { RollingNumber } from '../ui/RollingNumber';
import { ScrambleText } from '../ui/ScrambleText';
import { Badge } from '../ui/Badge';
import { MarketSessionClock } from './MarketSessionClock';

interface OverviewViewProps {
  trades: Trade[];
  activeAccount: TradingAccount | null;
  onOpenTradeModal: () => void;
  onSelectTrade: (trade: Trade) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  trades,
  activeAccount,
  onOpenTradeModal,
  onSelectTrade,
}) => {
  const [dateRange, setDateRange] = useState<'ALL' | '30D' | '90D' | 'YTD'>('ALL');

  // Filter trades based on date range
  const filteredTrades = useMemo(() => {
    if (dateRange === 'ALL') return trades;
    const now = new Date();
    const days = dateRange === '30D' ? 30 : dateRange === '90D' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return trades.filter((t) => {
      const d = new Date(t.entryDate);
      return d >= cutoff;
    });
  }, [trades, dateRange]);

  const startingBal = activeAccount?.initialBalance || 25000;
  const stats = useMemo(
    () => calculatePerformanceStats(filteredTrades, startingBal),
    [filteredTrades, startingBal]
  );

  const equityData = useMemo(
    () => calculateEquityCurve(filteredTrades, startingBal),
    [filteredTrades, startingBal]
  );

  // Daily P&L grouping for bar chart
  const dailyPnlData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTrades
      .filter((t) => t.status === 'CLOSED')
      .forEach((t) => {
        const d = t.exitDate || t.entryDate;
        map[d] = (map[d] || 0) + t.netPnL;
      });

    return Object.entries(map)
      .map(([date, pnl]) => ({
        date: date.substring(5), // MM-DD
        fullDate: date,
        pnl: Number(pnl.toFixed(2)),
      }))
      .slice(-14); // Last 14 trading days
  }, [filteredTrades]);

  // Performance by Session
  const sessionBreakdown = useMemo(() => {
    const res: Record<string, { count: number; pnl: number; wins: number }> = {
      LONDON: { count: 0, pnl: 0, wins: 0 },
      NEW_YORK: { count: 0, pnl: 0, wins: 0 },
      ASIA: { count: 0, pnl: 0, wins: 0 },
      OVERLAP: { count: 0, pnl: 0, wins: 0 },
    };

    filteredTrades
      .filter((t) => t.status === 'CLOSED')
      .forEach((t) => {
        const s = t.session || 'LONDON';
        if (!res[s]) res[s] = { count: 0, pnl: 0, wins: 0 };
        res[s].count++;
        res[s].pnl += t.netPnL;
        if (t.netPnL > 0) res[s].wins++;
      });

    return Object.entries(res).map(([session, data]) => ({
      session,
      trades: data.count,
      pnl: Number(data.pnl.toFixed(2)),
      winRate: data.count > 0 ? Number(((data.wins / data.count) * 100).toFixed(0)) : 0,
    }));
  }, [filteredTrades]);

  return (
    <div className="space-y-6">
      {/* Live Market Session Clock & Timezone Ticker */}
      <MarketSessionClock />

      {/* Date Range Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121212] border border-[#222222]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-300">
            <ScrambleText text="Analysis Window:" />
          </span>
          <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#262626]">
            {(['ALL', '30D', '90D', 'YTD'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  dateRange === r
                    ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {r === 'ALL' ? 'All Time' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>
            <ScrambleText text="Active Sample:" />{' '}
            <strong className="text-zinc-200 font-mono">
              <RollingNumber value={filteredTrades.length} decimals={0} triggerKey={dateRange} />
            </strong>{' '}
            <ScrambleText text="trades" />
          </span>
          <span className="text-zinc-600">|</span>
          <span>
            <ScrambleText text="Portfolio Currency:" />{' '}
            <strong className="text-amber-400 font-mono">
              {activeAccount?.currency || 'USD'}
            </strong>
          </span>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Net P&L */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424] relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Net Profit" triggerKey={dateRange} />
            </span>
            {stats.totalNetPnL >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono">
            <RollingNumber
              value={stats.totalNetPnL}
              prefix="$"
              colorCode
              triggerKey={dateRange}
            />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className={stats.returnPercent >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
              <RollingNumber
                value={stats.returnPercent}
                prefix={stats.returnPercent >= 0 ? '+' : ''}
                suffix="%"
                decimals={2}
                triggerKey={dateRange}
              />
            </span>
            <span className="text-zinc-400">
              <ScrambleText text="ROI" />
            </span>
          </div>
        </div>

        {/* Current Balance */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Balance" triggerKey={dateRange} />
            </span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-zinc-100">
            <RollingNumber
              value={stats.currentBalance}
              prefix="$"
              triggerKey={dateRange}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            <ScrambleText text="Initial:" />{' '}
            <RollingNumber value={stats.startingBalance} prefix="$" triggerKey={dateRange} />
          </p>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Win Rate" triggerKey={dateRange} />
            </span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-zinc-100">
            <RollingNumber
              value={stats.winRate}
              suffix="%"
              decimals={1}
              triggerKey={dateRange}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 font-mono">
            <RollingNumber value={stats.winningTrades} decimals={0} triggerKey={dateRange} />W /{' '}
            <RollingNumber value={stats.losingTrades} decimals={0} triggerKey={dateRange} />L (
            <RollingNumber value={stats.closedTrades} decimals={0} triggerKey={dateRange} /> closed)
          </p>
        </div>

        {/* Profit Factor */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Profit Factor" triggerKey={dateRange} />
            </span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-300">
            <RollingNumber
              value={stats.profitFactor}
              decimals={2}
              triggerKey={dateRange}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            <ScrambleText text="Avg W/L:" />{' '}
            <RollingNumber value={stats.averageWin} prefix="$" triggerKey={dateRange} /> /{' '}
            <RollingNumber value={stats.averageLoss} prefix="$" triggerKey={dateRange} />
          </p>
        </div>

        {/* Expectancy */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Expectancy" triggerKey={dateRange} />
            </span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-zinc-100">
            <RollingNumber
              value={stats.expectancy}
              prefix="$"
              colorCode
              triggerKey={dateRange}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            <ScrambleText text="Per trade edge" />
          </p>
        </div>

        {/* Max Drawdown */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              <ScrambleText text="Max Drawdown" triggerKey={dateRange} />
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-400">
            <RollingNumber
              value={stats.maxDrawdownPercent}
              suffix="%"
              decimals={1}
              triggerKey={dateRange}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            <ScrambleText text="Depth:" />{' '}
            <RollingNumber value={stats.maxDrawdownCash} prefix="$" triggerKey={dateRange} />
          </p>
        </div>
      </div>

      {/* Main Charts: Cumulative Equity Curve & Daily P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Equity Curve (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#131313] border border-[#222222]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                <ScrambleText text="Institutional Equity Growth Curve" triggerKey={dateRange} />
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                <ScrambleText text="Mark-to-market cumulative balance progression" />
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-400">
                <ScrambleText text="Peak:" />
              </span>
              <span className="text-emerald-400 font-bold">
                <RollingNumber
                  value={Math.max(...equityData.map((d) => d.equity), stats.startingBalance)}
                  prefix="$"
                  triggerKey={dateRange}
                />
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#555"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#222' }}
                />
                <YAxis
                  stroke="#555"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#222' }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                  domain={['dataMin - 500', 'dataMax + 500']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-[#1A1A1A] border border-[#333] rounded-xl shadow-xl font-mono text-xs">
                          <p className="text-zinc-400 mb-1">Trade #{data.tradeNumber} ({data.date})</p>
                          <p className="text-zinc-100 font-bold text-sm">
                            Balance: {formatCurrency(data.equity)}
                          </p>
                          <p className={`mt-0.5 ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Trade P&L: {formatCurrency(data.pnl, 'USD', true)}
                          </p>
                          <p className="text-rose-400 text-[10px] mt-0.5">
                            Drawdown: {data.drawdownPercent}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#goldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily P&L Bars */}
        <div className="p-5 rounded-2xl bg-[#131313] border border-[#222222] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  <ScrambleText text="Daily Net Performance" triggerKey={dateRange} />
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  <ScrambleText text="Last 14 trading sessions" />
                </p>
              </div>
            </div>

            <div className="h-48 sm:h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPnlData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" stroke="#555" fontSize={10} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2.5 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-lg font-mono text-xs">
                            <p className="text-zinc-400">{data.fullDate}</p>
                            <p className={`font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatCurrency(data.pnl, 'USD', true)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {dailyPnlData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? '#10B981' : '#F43F5E'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick breakdown metrics */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#202020] text-xs">
            <div className="p-2 rounded-xl bg-[#181818]">
              <span className="text-zinc-400 block text-[10px]">
                <ScrambleText text="Long Win Rate" />
              </span>
              <span className="font-mono font-bold text-zinc-200">
                <RollingNumber value={stats.longWinRate} suffix="%" decimals={0} triggerKey={dateRange} /> (
                <RollingNumber value={stats.longCount} decimals={0} triggerKey={dateRange} />)
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#181818]">
              <span className="text-zinc-400 block text-[10px]">
                <ScrambleText text="Short Win Rate" />
              </span>
              <span className="font-mono font-bold text-zinc-200">
                <RollingNumber value={stats.shortWinRate} suffix="%" decimals={0} triggerKey={dateRange} /> (
                <RollingNumber value={stats.shortCount} decimals={0} triggerKey={dateRange} />)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Session Breakdown & Execution Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Matrix */}
        <div className="p-5 rounded-2xl bg-[#131313] border border-[#222222]">
          <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <ScrambleText text="Session Profitability" triggerKey={dateRange} />
          </h3>
          <div className="space-y-2.5">
            {sessionBreakdown.map((item) => (
              <div
                key={item.session}
                className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#262626]"
              >
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">
                    <ScrambleText text={item.session} />
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    <RollingNumber value={item.trades} decimals={0} triggerKey={dateRange} /> trades •{' '}
                    <RollingNumber value={item.winRate} suffix="%" decimals={0} triggerKey={dateRange} /> win rate
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold">
                    <RollingNumber
                      value={item.pnl}
                      prefix="$"
                      colorCode
                      triggerKey={dateRange}
                    />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discipline & Risk Metrics */}
        <div className="p-5 rounded-2xl bg-[#131313] border border-[#222222]">
          <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <ScrambleText text="Risk & Discipline Score" triggerKey={dateRange} />
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-zinc-300">
                  <ScrambleText text="Rule-Following Discipline" />
                </span>
                <span className="font-mono font-bold text-amber-300">
                  <RollingNumber value={stats.ruleFollowingRate} suffix="%" decimals={0} triggerKey={dateRange} />
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(stats.ruleFollowingRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
                <span className="text-[10px] text-zinc-400 block">
                  <ScrambleText text="Consecutive Wins" />
                </span>
                <span className="font-mono text-base font-bold text-emerald-400">
                  <RollingNumber value={stats.winStreak} decimals={0} triggerKey={dateRange} />{' '}
                  <span className="text-xs">Max</span>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
                <span className="text-[10px] text-zinc-400 block">
                  <ScrambleText text="Consecutive Losses" />
                </span>
                <span className="font-mono text-base font-bold text-rose-400">
                  <RollingNumber value={stats.lossStreak} decimals={0} triggerKey={dateRange} />{' '}
                  <span className="text-xs">Max</span>
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                <ScrambleText text="Recovery Factor" />
              </span>
              <span className="font-mono font-bold text-zinc-200">
                <RollingNumber value={stats.recoveryFactor} suffix="x" decimals={2} triggerKey={dateRange} />
              </span>
            </div>
          </div>
        </div>

        {/* Recent Executions Widget */}
        <div className="p-5 rounded-2xl bg-[#131313] border border-[#222222]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
              <ScrambleText text="Recent Trades" triggerKey={dateRange} />
            </h3>
            <button
              onClick={onOpenTradeModal}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              <ScrambleText text="+ Log Trade" />
            </button>
          </div>

          <div className="space-y-2">
            {filteredTrades.slice(0, 4).map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTrade(t)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#181818] border border-[#252525] hover:border-[#D4AF37]/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={t.direction === 'LONG' ? 'green' : 'red'}
                    size="sm"
                  >
                    {t.direction}
                  </Badge>
                  <div>
                    <span className="text-xs font-bold text-zinc-200 font-mono block">
                      {t.symbol}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {formatDate(t.entryDate)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono text-xs font-bold block ${
                      t.status === 'OPEN'
                        ? 'text-amber-400'
                        : t.netPnL >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {t.status === 'OPEN' ? (
                      'OPEN'
                    ) : (
                      <RollingNumber value={t.netPnL} prefix="$" colorCode triggerKey={dateRange} />
                    )}
                  </span>
                  {t.realizedRR ? (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      <RollingNumber
                        value={t.realizedRR}
                        prefix={t.realizedRR > 0 ? '+' : ''}
                        suffix="R"
                        decimals={2}
                      />
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
            {filteredTrades.length === 0 && (
              <div className="text-center py-8 text-xs text-zinc-400">
                <ScrambleText text="No trades logged yet. Click Log Trade to start." />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
