import React, { useState, useEffect } from 'react';
import {
  Clock,
  Globe,
  Zap,
  Sun,
  Moon,
  Sunrise,
  Calendar,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Shield,
  Layers,
  Timer,
  Compass,
} from 'lucide-react';
import { ScrambleText } from '../ui/ScrambleText';

interface SessionSpec {
  name: string;
  code: string;
  city: string;
  timezone: string;
  startUTC: number; // UTC hour
  endUTC: number;   // UTC hour
  color: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const GLOBAL_CENTERS: SessionSpec[] = [
  {
    name: 'Asia / Tokyo',
    code: 'ASIA',
    city: 'Tokyo',
    timezone: 'Asia/Tokyo',
    startUTC: 0,
    endUTC: 9,
    color: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
    accent: '#A855F7',
    icon: Moon,
    description: 'Asian Range & Liquidity Sweeps',
  },
  {
    name: 'London',
    code: 'LONDON',
    city: 'London',
    timezone: 'Europe/London',
    startUTC: 7,
    endUTC: 16,
    color: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    accent: '#D4AF37',
    icon: Sunrise,
    description: 'European Institutional Liquidity Hub',
  },
  {
    name: 'London / NY Overlap',
    code: 'OVERLAP',
    city: 'Global',
    timezone: 'UTC',
    startUTC: 12,
    endUTC: 16,
    color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    accent: '#10B981',
    icon: Zap,
    description: 'Peak Institutional Volatility & Spreads',
  },
  {
    name: 'New York',
    code: 'NEW_YORK',
    city: 'New York',
    timezone: 'America/New_York',
    startUTC: 12,
    endUTC: 21,
    color: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
    accent: '#3B82F6',
    icon: Sun,
    description: 'US Equity & Macro Order Flow',
  },
];

// Major global financial holidays detection helper
function getMarketHolidayInfo(date: Date): { isHoliday: boolean; name?: string; impact: string } {
  const m = date.getUTCMonth() + 1; // 1-12
  const d = date.getUTCDate();
  const dayOfWeek = date.getUTCDay(); // 0 is Sun, 6 is Sat

  if (m === 1 && d === 1) return { isHoliday: true, name: "New Year's Day", impact: 'Full Market Closure' };
  if (m === 12 && d === 25) return { isHoliday: true, name: 'Christmas Day', impact: 'Global Markets Closed' };
  if (m === 12 && d === 26) return { isHoliday: true, name: 'Boxing Day', impact: 'UK / EU Bank Holiday' };
  if (m === 7 && d === 4) return { isHoliday: true, name: 'US Independence Day', impact: 'Early US Close' };
  if (m === 11 && dayOfWeek === 4 && d >= 22 && d <= 28) return { isHoliday: true, name: 'US Thanksgiving', impact: 'US Markets Closed' };

  return { isHoliday: false, impact: 'Normal Trading Conditions' };
}

export const MarketSessionClock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  // UTC Time calculations
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  const utcDecimal = utcHours + utcMinutes / 60 + utcSeconds / 3600;
  const dayOfWeek = now.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat

  const utcTimeStr = `${pad(utcHours)}:${pad(utcMinutes)}:${pad(utcSeconds)} UTC`;
  const utcDateStr = now.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Local Time calculations
  const localTimeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const localDateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  const tzOffset = -now.getTimezoneOffset() / 60;
  const tzOffsetStr = `GMT${tzOffset >= 0 ? '+' : ''}${tzOffset}`;

  // Market Weekend / Open Status Check
  // Forex opens Sunday 21:00 UTC and closes Friday 21:00 UTC
  const isWeekendClosed =
    (dayOfWeek === 5 && utcHours >= 21) ||
    dayOfWeek === 6 ||
    (dayOfWeek === 0 && utcHours < 21);

  const holidayInfo = getMarketHolidayInfo(now);

  // Active Sessions
  const activeSessions = GLOBAL_CENTERS.filter((s) => {
    if (s.startUTC <= s.endUTC) {
      return utcDecimal >= s.startUTC && utcDecimal < s.endUTC;
    } else {
      return utcDecimal >= s.startUTC || utcDecimal < s.endUTC;
    }
  });

  // Next Session & Countdown calculation
  let nextSession: SessionSpec | null = null;
  let minTimeToStartSeconds = Infinity;

  GLOBAL_CENTERS.forEach((s) => {
    let diffHours = s.startUTC - utcDecimal;
    if (diffHours <= 0) diffHours += 24;
    const diffSeconds = diffHours * 3600;
    if (diffSeconds < minTimeToStartSeconds) {
      minTimeToStartSeconds = diffSeconds;
      nextSession = s;
    }
  });

  const nextHours = Math.floor(minTimeToStartSeconds / 3600);
  const nextMinutes = Math.floor((minTimeToStartSeconds % 3600) / 60);
  const nextSecs = Math.floor(minTimeToStartSeconds % 60);
  const nextCountdownStr = `${pad(nextHours)}h ${pad(nextMinutes)}m ${pad(nextSecs)}s`;

  // Active Session closing countdown
  let activeSessionCloseStr = '';
  if (activeSessions.length > 0) {
    const primary = activeSessions[0];
    let remainHours = primary.endUTC - utcDecimal;
    if (remainHours < 0) remainHours += 24;
    const closeHours = Math.floor(remainHours);
    const closeMins = Math.floor((remainHours - closeHours) * 60);
    const closeSecs = Math.floor((remainHours * 3600) % 60);
    activeSessionCloseStr = `${pad(closeHours)}h ${pad(closeMins)}m ${pad(closeSecs)}s remaining`;
  }

  // Volatility & Spread Rating
  let volatilityLabel = 'Normal Volatility';
  let volatilityColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  let spreadRating = 'Raw Spreads: 0.0 - 0.2 pips';

  if (isWeekendClosed) {
    volatilityLabel = 'Weekend Off-Market';
    volatilityColor = 'text-zinc-400 bg-zinc-800 border-zinc-700';
    spreadRating = 'Forex Closed • Crypto 24/7 Active';
  } else if (activeSessions.some((s) => s.code === 'OVERLAP')) {
    volatilityLabel = 'Peak Institutional Volatility';
    volatilityColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 animate-pulse';
    spreadRating = 'Ultra-Tight: 0.0 - 0.1 pips';
  } else if (activeSessions.some((s) => s.code === 'LONDON')) {
    volatilityLabel = 'High European Liquidity';
    volatilityColor = 'text-amber-300 bg-amber-500/10 border-amber-500/30';
    spreadRating = 'Tight Spreads: 0.1 - 0.2 pips';
  } else if (activeSessions.some((s) => s.code === 'NEW_YORK')) {
    volatilityLabel = 'High US Order Flow';
    volatilityColor = 'text-blue-300 bg-blue-500/10 border-blue-500/30';
    spreadRating = 'Liquid: 0.1 - 0.3 pips';
  } else {
    volatilityLabel = 'Consolidation / Range Phase';
    volatilityColor = 'text-purple-300 bg-purple-500/10 border-purple-500/30';
    spreadRating = 'Moderate: 0.2 - 0.5 pips';
  }

  // Financial Hub times
  const getCityTime = (tz: string) => {
    try {
      return now.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return '--:--:--';
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#161616] via-[#101010] to-[#0B0B0B] border border-[#262626] shadow-2xl relative overflow-hidden">
      {/* Luxury Gold Ambient Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#F2D675] to-transparent shadow-[0_0_15px_#D4AF37]" />

      {/* Centered Widget Title & Status Subheader */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono uppercase font-bold text-amber-300 tracking-widest mb-2 shadow-sm">
          <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Interbank Market Engine</span>
        </div>
        <h2 className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-[#FFF6D6] via-[#D4AF37] to-[#A88422] bg-clip-text text-transparent">
          <ScrambleText text="Global Trading Sessions & Real-Time Liquidity Clock" />
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-xl mx-auto font-medium">
          Multi-timezone synchronization across London, New York, Tokyo, and Sydney interbank centers.
        </p>
      </div>

      {/* Main 3-Column Metrics Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-5 border-b border-[#1E1E1E]">
        {/* Column 1: UTC Master Clock & Local Time */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424] flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
              <span className="font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1.5 text-zinc-400">
                <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
                Universal Coordinated Time
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-bold">
                UTC / GMT
              </span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
              {utcTimeStr}
            </div>
            <span className="text-xs text-zinc-400 font-mono mt-1 block">{utcDateStr}</span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F1F1F]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-zinc-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-300" />
                Local Time ({tzOffsetStr})
              </span>
              <span className="text-zinc-400 text-[10px] font-mono truncate max-w-[120px]">
                {localTimezone.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold text-amber-300">{localTimeStr}</span>
              <span className="text-[10px] text-zinc-500 font-mono">{localDateStr}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Current Market Status & Volatility */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424] flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold uppercase text-[10px] tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Market Regime & Status
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isWeekendClosed
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    : holidayInfo.isHoliday
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isWeekendClosed
                  ? 'WEEKEND'
                  : holidayInfo.isHoliday
                  ? 'HOLIDAY REGIME'
                  : 'LIVE TRADING'}
              </span>
            </div>

            {/* Status Headline */}
            <div className="text-base sm:text-lg font-bold text-zinc-100 mt-1">
              {isWeekendClosed ? (
                <span className="text-zinc-400">Forex & Indices Closed</span>
              ) : holidayInfo.isHoliday ? (
                <span className="text-amber-300">{holidayInfo.name}</span>
              ) : (
                <span className="text-emerald-400">Global Interbank Markets Open</span>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 mt-1">
              {isWeekendClosed
                ? 'Forex reopens Sunday 21:00 UTC (Tokyo/Sydney Open). Crypto is live 24/7.'
                : holidayInfo.isHoliday
                ? `${holidayInfo.impact}. Thinner volume; expect wider spreads on major pairs.`
                : 'Active continuous institutional quoting across global interbank desks.'}
            </p>
          </div>

          {/* Volatility & Spread Rating Box */}
          <div className="mt-4 pt-3 border-t border-[#1F1F1F] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 text-[10px] uppercase font-semibold">Liquidity Index</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${volatilityColor}`}>
                {volatilityLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 text-[10px]">Spread Condition:</span>
              <span className="text-zinc-300 text-[11px] font-semibold">{spreadRating}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Active Session & Next Countdown */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424] flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold uppercase text-[10px] tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                Session Architecture
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                {activeSessions.length} Active
              </span>
            </div>

            {/* Active Session Display */}
            <div className="mt-1">
              <span className="text-xs text-zinc-400 block font-medium">Currently Trading:</span>
              <div className="font-mono text-base sm:text-lg font-extrabold text-amber-300">
                {activeSessions.length > 0
                  ? activeSessions.map((s) => s.name).join(' + ')
                  : 'Off-Peak Interbank Bridge'}
              </div>
              {activeSessionCloseStr && (
                <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                  ⏱ {activeSessionCloseStr}
                </span>
              )}
            </div>
          </div>

          {/* Next Session Countdown Card */}
          {nextSession && (
            <div className="mt-4 pt-3 border-t border-[#1F1F1F] flex items-center justify-between p-2.5 rounded-xl bg-[#181818] border border-[#262626]">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Next: {(nextSession as SessionSpec).name}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {pad((nextSession as SessionSpec).startUTC)}:00 UTC
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-black text-zinc-100 block">
                  {nextCountdownStr}
                </span>
                <span className="text-[9px] text-amber-400 font-semibold">until open</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Major Financial Centers Live Digital Clocks */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { city: 'London', tz: 'Europe/London', hub: 'LSE / FX Hub', activeCode: 'LONDON' },
          { city: 'New York', tz: 'America/New_York', hub: 'NYSE / Wall St', activeCode: 'NEW_YORK' },
          { city: 'Tokyo', tz: 'Asia/Tokyo', hub: 'TSE / Asian Hub', activeCode: 'ASIA' },
          { city: 'Sydney', tz: 'Australia/Sydney', hub: 'ASX / Pacific', activeCode: 'ASIA' },
        ].map((c) => {
          const isActive = activeSessions.some((s) => s.code === c.activeCode);
          return (
            <div
              key={c.city}
              className={`p-3 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-[#181818] border-[#D4AF37]/40 shadow-md shadow-amber-500/5'
                  : 'bg-[#121212] border-[#222] opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-zinc-200">{c.city}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isActive ? 'ACTIVE' : 'CLOSED'}
                </span>
              </div>
              <div className="font-mono text-sm sm:text-base font-extrabold text-zinc-100 tracking-tight">
                {getCityTime(c.tz)}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono block mt-0.5 truncate">{c.hub}</span>
            </div>
          );
        })}
      </div>

      {/* Global Session Timeline Bar */}
      <div className="mt-4 pt-3 border-t border-[#1C1C1C] flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Active Trading Windows (UTC):</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] flex-wrap">
          <span className="text-purple-400">Asia 00-09</span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-300 font-bold">London 07-16</span>
          <span className="text-zinc-600">•</span>
          <span className="text-emerald-400 font-bold">Overlap 12-16</span>
          <span className="text-zinc-600">•</span>
          <span className="text-blue-400">NY 12-21</span>
        </div>
      </div>
    </div>
  );
};
