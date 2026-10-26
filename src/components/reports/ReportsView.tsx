import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Award,
  TrendingUp,
  AlertOctagon,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { Trade, TradingAccount, MonthlyReport } from '../../types/trade';
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters';
import { calculatePerformanceStats } from '../../utils/calculations';
import { BrandLogo } from '../ui/BrandLogo';

interface ReportsViewProps {
  trades: Trade[];
  activeAccount: TradingAccount | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ trades, activeAccount }) => {
  // Available months from trades
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    trades.forEach((t) => {
      if (t.entryDate) months.add(t.entryDate.substring(0, 7)); // YYYY-MM
    });
    // Add current month if empty
    months.add(new Date().toISOString().substring(0, 7));
    return Array.from(months).sort().reverse();
  }, [trades]);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths[0] || new Date().toISOString().substring(0, 7)
  );

  const monthTrades = useMemo(() => {
    return trades.filter((t) => t.entryDate && t.entryDate.startsWith(selectedMonth));
  }, [trades, selectedMonth]);

  const startingBalance = activeAccount?.initialBalance || 25000;
  const stats = useMemo(
    () => calculatePerformanceStats(monthTrades, startingBalance),
    [monthTrades, startingBalance]
  );

  // Best & Worst trades
  const closed = monthTrades.filter((t) => t.status === 'CLOSED');
  const bestTrade = closed.length > 0 ? [...closed].sort((a, b) => b.netPnL - a.netPnL)[0] : null;
  const worstTrade = closed.length > 0 ? [...closed].sort((a, b) => a.netPnL - b.netPnL)[0] : null;

  // Best Strategy
  const stratMap: Record<string, number> = {};
  closed.forEach((t) => {
    const s = t.strategy || 'Discretionary';
    stratMap[s] = (stratMap[s] || 0) + t.netPnL;
  });
  const bestStrategy = Object.entries(stratMap).sort((a, b) => b[1] - a[1])[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportReportCSV = () => {
    const lines = [
      `ManKatFx Institutional Monthly Statement - ${selectedMonth}`,
      `Account: ${activeAccount?.name || 'Default Portfolio'} (${activeAccount?.currency || 'USD'})`,
      `Starting Balance,${stats.startingBalance}`,
      `Ending Balance,${stats.currentBalance}`,
      `Net Profit/Loss,${stats.totalNetPnL}`,
      `Return Percentage,${stats.returnPercent}%`,
      `Total Trades,${stats.totalTrades}`,
      `Win Rate,${stats.winRate}%`,
      `Profit Factor,${stats.profitFactor}`,
      `Expectancy,${stats.expectancy}`,
      `Max Drawdown,${stats.maxDrawdownPercent}%`,
      `Best Trade,${bestTrade ? `${bestTrade.symbol} (+${bestTrade.netPnL})` : 'N/A'}`,
      `Worst Trade,${worstTrade ? `${worstTrade.symbol} (${worstTrade.netPnL})` : 'N/A'}`,
      `Discipline Adherence,${stats.ruleFollowingRate}%`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ManKatFx_Report_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Month Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121212] border border-[#222]">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-300">Reporting Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#181818] border border-[#282828] text-zinc-100 font-mono text-xs rounded-xl px-3 py-1.5 focus:border-[#D4AF37] focus:outline-none"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {new Date(`${m}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#181818] border border-[#282828] text-zinc-300 hover:text-zinc-100 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF Report</span>
          </button>
        </div>
      </div>

      {/* Formal Performance Statement Card */}
      <div className="rounded-2xl bg-[#131313] border border-[#242424] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Gold Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[#222] gap-4">
          <div>
            <BrandLogo size="sm" withText badge="STATEMENT" className="mb-1" />
            <p className="text-xs text-zinc-400 mt-1">
              Account: {activeAccount?.name || 'Primary Portfolio'} • Ref #{activeAccount?.accountNumber || '8839210'}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-zinc-400">
            <p>Period: <strong className="text-zinc-200">{selectedMonth}</strong></p>
            <p>Generated: <strong className="text-zinc-200">{new Date().toISOString().split('T')[0]}</strong></p>
          </div>
        </div>

        {/* Primary Financial Balance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-[#222]">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Opening Balance</span>
            <span className="text-lg font-mono font-bold text-zinc-200">
              {formatCurrency(stats.startingBalance)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Closing Balance</span>
            <span className="text-lg font-mono font-bold text-zinc-100">
              {formatCurrency(stats.currentBalance)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Net Performance</span>
            <span
              className={`text-lg font-mono font-bold ${
                stats.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(stats.totalNetPnL, 'USD', true)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Monthly ROI</span>
            <span
              className={`text-lg font-mono font-bold ${
                stats.returnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatPercent(stats.returnPercent)}
            </span>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="py-6 border-b border-[#222]">
          <h4 className="text-xs uppercase tracking-wider font-bold text-zinc-300 mb-4">
            Audited Trading Metrics
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#171717]">
              <span className="text-zinc-400 block text-[10px]">Total Closed Trades</span>
              <span className="text-zinc-100 font-bold">{stats.closedTrades}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#171717]">
              <span className="text-zinc-400 block text-[10px]">Win Rate</span>
              <span className="text-emerald-400 font-bold">{stats.winRate}%</span>
            </div>
            <div className="p-3 rounded-xl bg-[#171717]">
              <span className="text-zinc-400 block text-[10px]">Profit Factor</span>
              <span className="text-amber-300 font-bold">{stats.profitFactor}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#171717]">
              <span className="text-zinc-400 block text-[10px]">Expectancy / Trade</span>
              <span className="text-zinc-100 font-bold">{formatCurrency(stats.expectancy, 'USD', true)}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#171717]">
              <span className="text-zinc-400 block text-[10px]">Average Winner</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(stats.averageWin)}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#171717]">
              <span className="text-zinc-400 block text-[10px]">Average Loser</span>
              <span className="text-rose-400 font-bold">{formatCurrency(stats.averageLoss)}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#171717]">
              <span className="text-zinc-400 block text-[10px]">Max Drawdown</span>
              <span className="text-rose-400 font-bold">{stats.maxDrawdownPercent}%</span>
            </div>
            <div className="p-3 rounded-xl bg-[#171717]">
              <span className="text-zinc-400 block text-[10px]">Rule Discipline</span>
              <span className="text-amber-300 font-bold">{stats.ruleFollowingRate}%</span>
            </div>
          </div>
        </div>

        {/* Highlights & Qualitative Audit */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#181818] border border-[#252525]">
            <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Best Trade</span>
            {bestTrade ? (
              <div className="mt-1">
                <span className="font-bold text-emerald-400 font-mono text-sm block">
                  {bestTrade.symbol}: {formatCurrency(bestTrade.netPnL, 'USD', true)}
                </span>
                <span className="text-[10px] text-zinc-400">{formatDate(bestTrade.entryDate)}</span>
              </div>
            ) : (
              <span className="text-zinc-400 mt-1 block">N/A</span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#181818] border border-[#252525]">
            <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Largest Loss</span>
            {worstTrade ? (
              <div className="mt-1">
                <span className="font-bold text-rose-400 font-mono text-sm block">
                  {worstTrade.symbol}: {formatCurrency(worstTrade.netPnL, 'USD', true)}
                </span>
                <span className="text-[10px] text-zinc-400">{formatDate(worstTrade.entryDate)}</span>
              </div>
            ) : (
              <span className="text-zinc-400 mt-1 block">N/A</span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#181818] border border-[#252525]">
            <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Top Performing Setup</span>
            <div className="mt-1">
              <span className="font-bold text-amber-300 font-mono text-sm block">
                {bestStrategy ? bestStrategy[0] : 'Discretionary'}
              </span>
              <span className="text-[10px] text-zinc-400">
                {bestStrategy ? formatCurrency(bestStrategy[1], 'USD', true) : '$0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
