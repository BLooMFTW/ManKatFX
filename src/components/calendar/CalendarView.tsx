import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  CheckCircle2,
  FileEdit,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Trade } from '../../types/trade';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { RollingNumber } from '../ui/RollingNumber';
import { ScrambleText } from '../ui/ScrambleText';

interface CalendarViewProps {
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ trades, onSelectTrade }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mobileMode, setMobileMode] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [selectedDayDateStr, setSelectedDayDateStr] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
  });

  const [selectedDayTradesModal, setSelectedDayTradesModal] = useState<{ date: string; trades: Trade[] } | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review states
  const [reviewWell, setReviewWell] = useState('Pushed winners to 2.5R target and adhered to stop loss.');
  const [reviewWrong, setReviewWrong] = useState('Took 1 impulsive trade outside key session liquidity hours.');
  const [nextTarget, setNextTarget] = useState('Zero trades taken outside 07:00-11:00 UTC London window.');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map trades by date string YYYY-MM-DD
  const tradesByDate = useMemo(() => {
    const map: Record<string, { trades: Trade[]; pnl: number; wins: number; total: number }> = {};
    trades.forEach((t) => {
      const d = t.exitDate || t.entryDate;
      if (!map[d]) map[d] = { trades: [], pnl: 0, wins: 0, total: 0 };
      map[d].trades.push(t);
      if (t.status === 'CLOSED') {
        map[d].pnl += t.netPnL;
        map[d].total++;
        if (t.netPnL > 0) map[d].wins++;
      }
    });
    return map;
  }, [trades]);

  // Standard Monday-start calendar grid calculation
  const firstDayOfMonthRaw = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon
  const firstDayOffset = firstDayOfMonthRaw === 0 ? 6 : firstDayOfMonthRaw - 1; // 0 for Mon, 6 for Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const data = tradesByDate[dateStr];
      days.push({
        dayNumber: d,
        dateStr,
        trades: data ? data.trades : [],
        pnl: data ? data.pnl : 0,
        count: data ? data.total : 0,
        winRate: data && data.total > 0 ? (data.wins / data.total) * 100 : 0,
      });
    }
    return days;
  }, [year, month, firstDayOffset, daysInMonth, tradesByDate]);

  // Month P&L summary
  const monthStats = useMemo(() => {
    let pnl = 0;
    let count = 0;
    let wins = 0;
    calendarDays.forEach((cd) => {
      if (cd && cd.count > 0) {
        pnl += cd.pnl;
        count += cd.count;
        cd.trades.forEach((t) => {
          if (t.status === 'CLOSED' && t.netPnL > 0) wins++;
        });
      }
    });
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    return { pnl: Number(pnl.toFixed(2)), count, winRate };
  }, [calendarDays]);

  // ----------------- MOBILE WEEKLY VIEW (Monday to Sunday) -----------------
  const currentWeekDays = useMemo(() => {
    const targetDate = new Date(currentDate);
    const day = targetDate.getDay();
    // Monday as first day of trading week:
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() + diffToMonday);

    const week = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const data = tradesByDate[dateStr];

      week.push({
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        monthShort: d.toLocaleString('default', { month: 'short' }),
        dateStr,
        dateObj: d,
        trades: data ? data.trades : [],
        pnl: data ? data.pnl : 0,
        count: data ? data.total : 0,
        winRate: data && data.total > 0 ? (data.wins / data.total) * 100 : 0,
        isToday: new Date().toISOString().split('T')[0] === dateStr,
      });
    }
    return week;
  }, [currentDate, tradesByDate]);

  const weekRangeLabel = useMemo(() => {
    if (currentWeekDays.length < 7) return '';
    const start = currentWeekDays[0];
    const end = currentWeekDays[6];
    return `${start.monthShort} ${start.dayNumber} – ${end.monthShort} ${end.dayNumber}, ${start.dateObj.getFullYear()}`;
  }, [currentWeekDays]);

  const weekStats = useMemo(() => {
    let pnl = 0;
    let count = 0;
    let wins = 0;
    currentWeekDays.forEach((d) => {
      pnl += d.pnl;
      count += d.count;
      d.trades.forEach((t) => {
        if (t.status === 'CLOSED' && t.netPnL > 0) wins++;
      });
    });
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    return { pnl: Number(pnl.toFixed(2)), count, winRate };
  }, [currentWeekDays]);

  // Selected Day Details for Inspector
  const activeDayData = useMemo(() => {
    const data = tradesByDate[selectedDayDateStr];
    const d = new Date(selectedDayDateStr + 'T00:00:00');
    return {
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
      dateStr: selectedDayDateStr,
      dateObj: d,
      trades: data ? data.trades : [],
      pnl: data ? data.pnl : 0,
      count: data ? data.total : 0,
      winRate: data && data.total > 0 ? (data.wins / data.total) * 100 : 0,
      isToday: new Date().toISOString().split('T')[0] === selectedDayDateStr,
    };
  }, [selectedDayDateStr, tradesByDate]);

  // Navigation handlers
  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setCurrentDate(d);
  };

  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setCurrentDate(d);
  };

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
    // select monday of that week
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    setSelectedDayDateStr(
      `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(
        mon.getDate()
      ).padStart(2, '0')}`
    );
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    setSelectedDayDateStr(
      `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(
        mon.getDate()
      ).padStart(2, '0')}`
    );
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayDateStr(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`
    );
  };

  // Helper for ultra-clean compact currency label on mobile tiles
  const formatCompactPnL = (val: number): string => {
    const abs = Math.abs(val);
    const sign = val >= 0 ? '+' : '-';
    if (abs >= 1000) {
      return `${sign}${(abs / 1000).toFixed(1)}k`;
    }
    return `${sign}$${Math.round(abs)}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ========================================================================= */}
      {/* MOBILE VIEW (< 768px): Clean 7-col weekly strip and refined month grid    */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4">
        {/* Mobile Header Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121212] border border-[#242424] shadow-xl space-y-3">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalIcon className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold text-zinc-100 tracking-tight">Calendar</span>
            </div>

            <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#282828]">
              <button
                type="button"
                onClick={() => setMobileMode('WEEKLY')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mobileMode === 'WEEKLY'
                    ? 'bg-[#D4AF37] text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Week View
              </button>
              <button
                type="button"
                onClick={() => setMobileMode('MONTHLY')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mobileMode === 'MONTHLY'
                    ? 'bg-[#D4AF37] text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Month View
              </button>
            </div>
          </div>

          {/* Stepper Navigation: Deliberate and precise, no erratic touch hijacking */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1C1C1C]">
            <button
              type="button"
              onClick={mobileMode === 'WEEKLY' ? prevWeek : prevMonth}
              className="p-2 px-3 rounded-xl bg-[#181818] border border-[#2B2B2B] text-zinc-200 hover:text-white transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-medium"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[10px]">Prev</span>
            </button>

            <div className="text-center min-w-0 px-2">
              <span className="text-xs font-extrabold text-zinc-100 font-mono block truncate">
                {mobileMode === 'WEEKLY' ? weekRangeLabel : monthName}
              </span>
              <button
                type="button"
                onClick={jumpToToday}
                className="text-[10px] text-[#D4AF37] hover:underline font-mono font-bold cursor-pointer"
              >
                Jump to Today
              </button>
            </div>

            <button
              type="button"
              onClick={mobileMode === 'WEEKLY' ? nextWeek : nextMonth}
              className="p-2 px-3 rounded-xl bg-[#181818] border border-[#2B2B2B] text-zinc-200 hover:text-white transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-medium"
              aria-label="Next"
            >
              <span className="text-[10px]">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1C1C1C] text-center font-mono">
            <div className="p-2 rounded-xl bg-[#161616] border border-[#222]">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-sans block">
                {mobileMode === 'WEEKLY' ? 'Week P&L' : 'Month P&L'}
              </span>
              <span
                className={`text-xs font-black block ${
                  (mobileMode === 'WEEKLY' ? weekStats.pnl : monthStats.pnl) >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {formatCurrency(
                  mobileMode === 'WEEKLY' ? weekStats.pnl : monthStats.pnl,
                  'USD',
                  true
                )}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#161616] border border-[#222]">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-sans block">
                Trades
              </span>
              <span className="text-xs font-bold text-zinc-100 block">
                {mobileMode === 'WEEKLY' ? weekStats.count : monthStats.count}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#161616] border border-[#222]">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-sans block">
                Win Rate
              </span>
              <span className="text-xs font-bold text-amber-300 block">
                {(mobileMode === 'WEEKLY' ? weekStats.winRate : monthStats.winRate).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* 1. Mobile Week View: Perfectly fits all 7 days without scrolling */}
        {mobileMode === 'WEEKLY' && (
          <div className="p-3 rounded-2xl bg-[#131313] border border-[#222] shadow-xl">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {currentWeekDays.map((d) => {
                const isSelected = selectedDayDateStr === d.dateStr;
                const hasTrades = d.count > 0;
                const isProfit = d.pnl > 0;
                const isLoss = d.pnl < 0;

                let borderStyle = 'border-[#242424]';
                let bgStyle = 'bg-[#171717]';

                if (isSelected) {
                  borderStyle = 'border-[#D4AF37] ring-1 ring-[#D4AF37]/60 shadow-md shadow-amber-500/10';
                  bgStyle = 'bg-[#201D14]';
                } else if (hasTrades) {
                  if (isProfit) bgStyle = 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300';
                  else if (isLoss) bgStyle = 'bg-rose-950/25 border-rose-500/40 text-rose-300';
                }

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDayDateStr(d.dateStr)}
                    className={`py-2 px-1 rounded-xl border ${borderStyle} ${bgStyle} flex flex-col items-center justify-between transition cursor-pointer active:scale-95 min-h-[4.75rem]`}
                  >
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-tighter">
                      {d.dayName}
                    </span>

                    <span
                      className={`text-sm sm:text-base font-mono font-black my-0.5 ${
                        d.isToday ? 'text-amber-400 underline underline-offset-2' : 'text-zinc-100'
                      }`}
                    >
                      {d.dayNumber}
                    </span>

                    {hasTrades ? (
                      <div className="w-full text-center">
                        <span
                          className={`text-[9px] font-mono font-black block truncate leading-tight ${
                            isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-zinc-300'
                          }`}
                        >
                          {formatCompactPnL(d.pnl)}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500 block">
                          {d.count}T
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-zinc-600 font-mono">--</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Mobile Month View: Clean 7-column calendar grid with trade indicators */}
        {mobileMode === 'MONTHLY' && (
          <div className="p-3 rounded-2xl bg-[#131313] border border-[#222] shadow-xl">
            {/* Days of week header (Mon - Sun) */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* 7-col Day Cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, index) => {
                if (!item) {
                  return <div key={`mb-blank-${index}`} className="aspect-square rounded-xl bg-[#0C0C0C]/50" />;
                }
                const isSelected = selectedDayDateStr === item.dateStr;
                const hasTrades = item.count > 0;
                const isProfit = item.pnl > 0;
                const isLoss = item.pnl < 0;

                let cellBorder = 'border-[#222]';
                let cellBg = 'bg-[#161616]';

                if (isSelected) {
                  cellBorder = 'border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-sm';
                  cellBg = 'bg-[#221E14]';
                } else if (hasTrades) {
                  if (isProfit) cellBg = 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300';
                  else if (isLoss) cellBg = 'bg-rose-950/20 border-rose-500/40 text-rose-300';
                }

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedDayDateStr(item.dateStr)}
                    className={`aspect-square p-1 rounded-xl border flex flex-col justify-between items-center transition cursor-pointer active:scale-90 ${cellBorder} ${cellBg}`}
                  >
                    <span className="text-[10px] font-mono font-bold text-zinc-300">
                      {item.dayNumber}
                    </span>

                    {hasTrades ? (
                      <span
                        className={`text-[8px] font-mono font-bold leading-none truncate max-w-full block ${
                          isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-zinc-300'
                        }`}
                      >
                        {formatCompactPnL(item.pnl)}
                      </span>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Day Performance Inspector (Integrated seamlessly on Mobile) */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#202020]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">
                Daily Performance Inspector
              </span>
              <h3 className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5">
                <span>{formatDate(activeDayData.dateStr)}</span>
                {activeDayData.isToday && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Today
                  </span>
                )}
              </h3>
            </div>

            <div className="text-right font-mono">
              <span
                className={`text-sm font-extrabold block ${
                  activeDayData.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(activeDayData.pnl, 'USD', true)}
              </span>
              <span className="text-[10px] text-zinc-400">
                {activeDayData.count} trades • {activeDayData.winRate.toFixed(0)}% win
              </span>
            </div>
          </div>

          {/* List of executions on the active day */}
          {activeDayData.trades.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500 font-mono">
              No executions recorded on this date. Tap any day above to inspect.
            </div>
          ) : (
            <div className="space-y-2">
              {activeDayData.trades.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTrade(t)}
                  className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] hover:border-[#D4AF37]/50 flex items-center justify-between active:scale-[0.98] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={t.direction === 'LONG' ? 'green' : 'red'} size="sm">
                      {t.direction === 'LONG' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.direction}
                    </Badge>
                    <div>
                      <span className="font-mono font-bold text-xs text-zinc-100 block">
                        {t.symbol}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {t.strategy || 'Discretionary'} • {t.entryTime || '09:00'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span
                        className={`text-xs font-mono font-bold block ${
                          t.status === 'OPEN'
                            ? 'text-amber-400'
                            : t.netPnL >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {t.status === 'OPEN' ? 'OPEN' : formatCurrency(t.netPnL, 'USD', true)}
                      </span>
                      {t.realizedRR ? (
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {t.realizedRR > 0 ? `+${t.realizedRR}R` : `${t.realizedRR}R`}
                        </span>
                      ) : null}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (>= 768px): Institutional 7x5 Monthly Heatmap                */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6">
        {/* Calendar Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121212] border border-[#222]">
          <div className="flex items-center gap-3">
            <CalIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-zinc-100">{monthName}</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous Month"
                className="p-1.5 rounded-lg bg-[#181818] border border-[#262626] text-zinc-300 hover:text-zinc-100 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next Month"
                className="p-1.5 rounded-lg bg-[#181818] border border-[#262626] text-zinc-300 hover:text-zinc-100 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={jumpToToday}
              className="text-xs text-[#D4AF37] hover:underline font-mono ml-2 font-bold cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Monthly Stat Ticker */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-zinc-400 block text-[10px] uppercase">
                <ScrambleText text="Month Net P&L" triggerKey={monthName} />
              </span>
              <span className="font-bold text-sm">
                <RollingNumber value={monthStats.pnl} prefix="$" colorCode triggerKey={monthName} />
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Structured Review</span>
            </button>
          </div>
        </div>

        {/* Days of Week Header (Mon - Sun) */}
        <div className="rounded-2xl bg-[#131313] border border-[#222] p-4 shadow-xl">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((item, index) => {
              if (!item) {
                return (
                  <div
                    key={`blank-${index}`}
                    className="h-24 sm:h-28 rounded-xl bg-[#0D0D0D]/40 border border-transparent"
                  />
                );
              }

              const hasTrades = item.count > 0;
              const isProfit = item.pnl > 0;
              const isLoss = item.pnl < 0;

              let bgStyle = 'bg-[#161616] border-[#222]';
              if (hasTrades) {
                if (isProfit) bgStyle = 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/60';
                else if (isLoss) bgStyle = 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400/60';
                else bgStyle = 'bg-zinc-800/40 border-zinc-700 hover:border-zinc-500';
              }

              return (
                <div
                  key={item.dateStr}
                  onClick={() => {
                    if (item.trades.length > 0) {
                      setSelectedDayTradesModal({ date: item.dateStr, trades: item.trades });
                    }
                  }}
                  className={`h-24 sm:h-28 p-2 rounded-xl border flex flex-col justify-between transition cursor-pointer ${bgStyle}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-zinc-300">
                      {item.dayNumber}
                    </span>
                    {hasTrades && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-zinc-300">
                        {item.count}T
                      </span>
                    )}
                  </div>

                  {hasTrades ? (
                    <div className="mt-auto">
                      <span
                        className={`text-[10px] sm:text-xs font-mono font-bold block truncate ${
                          isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-zinc-300'
                        }`}
                        title={formatCurrency(item.pnl, 'USD', true)}
                      >
                        {formatCompactPnL(item.pnl)}
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-zinc-400 font-mono block">
                        {item.winRate.toFixed(0)}% Win
                      </span>
                    </div>
                  ) : (
                    <div className="mt-auto text-[9px] sm:text-[10px] text-zinc-600 font-mono">No trades</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Trades Inspector Modal (Desktop) */}
      <Modal
        isOpen={!!selectedDayTradesModal}
        onClose={() => setSelectedDayTradesModal(null)}
        title={selectedDayTradesModal ? `Trading Record: ${formatDate(selectedDayTradesModal.date)}` : ''}
        subtitle="Executions and psychological audit notes recorded on this date."
        maxWidth="max-w-xl"
      >
        <div className="space-y-3">
          {selectedDayTradesModal?.trades.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                setSelectedDayTradesModal(null);
                onSelectTrade(t);
              }}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#181818] border border-[#282828] hover:border-[#D4AF37]/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Badge variant={t.direction === 'LONG' ? 'green' : 'red'} size="sm">
                  {t.direction}
                </Badge>
                <div>
                  <span className="font-mono font-bold text-sm text-zinc-100 block">
                    {t.symbol}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {t.strategy || 'Discretionary'} • {t.entryTime || '09:00'}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span
                  className={`text-sm font-bold block ${
                    t.status === 'OPEN'
                      ? 'text-amber-400'
                      : t.netPnL >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {t.status === 'OPEN' ? 'OPEN' : formatCurrency(t.netPnL, 'USD', true)}
                </span>
                {t.realizedRR ? (
                  <span className="text-[10px] text-zinc-400">
                    {t.realizedRR > 0 ? `+${t.realizedRR}R` : `${t.realizedRR}R`}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Structured Periodic Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Weekly & Monthly Trading Review"
        subtitle="Institutional retrospective workflow to eliminate leaks and build consistency."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              What went exceptionally well this period?
            </label>
            <textarea
              rows={2}
              value={reviewWell}
              onChange={(e) => setReviewWell(e.target.value)}
              className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl p-2.5 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              What went wrong or broke discipline?
            </label>
            <textarea
              rows={2}
              value={reviewWrong}
              onChange={(e) => setReviewWrong(e.target.value)}
              className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl p-2.5 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Next period primary improvement target
            </label>
            <textarea
              rows={2}
              value={nextTarget}
              onChange={(e) => setNextTarget(e.target.value)}
              className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl p-2.5 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div className="flex justify-end pt-3 border-t border-[#222]">
            <button
              type="button"
              onClick={() => {
                alert('Structured review saved to your performance record!');
                setIsReviewModalOpen(false);
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold text-xs shadow-md transition cursor-pointer"
            >
              Save Review
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
