import React from 'react';
import { Plus, Wifi, ShieldCheck, Lock } from 'lucide-react';
import { ScrambleText } from '../ui/ScrambleText';
import { RollingNumber } from '../ui/RollingNumber';
import { NavTab } from './Sidebar';
import { BrandLogo } from '../ui/BrandLogo';

interface TopBarProps {
  currentTab: NavTab;
  onOpenTradeModal: () => void;
  openTradesCount: number;
  marketStatus: 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'OFFLINE';
  isAuthenticated?: boolean;
  onOpenResetPin?: () => void;
  isRealtimeActive?: boolean;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Performance Overview',
    subtitle: 'Institutional metrics, equity curve & risk parameters',
  },
  journal: {
    title: 'Trading Journal',
    subtitle: 'Active trade logs, execution discipline & setup notes',
  },
  history: {
    title: 'Trade Ledger & History',
    subtitle: 'Filter, inspect, export and audit historical executions',
  },
  backtest: {
    title: 'Backtest Suite & Engine',
    subtitle: 'Quantify edge across instruments, setups, and timeframes',
  },
  analytics: {
    title: 'Quantitative Analytics',
    subtitle: 'Expectancy, payoff ratios, drawdowns & setup performance',
  },
  calendar: {
    title: 'Trading Calendar',
    subtitle: 'Daily P&L heatmap, weekly performance strip & periodic reviews',
  },
  reports: {
    title: 'Monthly Performance Reports',
    subtitle: 'Automated executive summaries, lessons & goal progress',
  },
  calculators: {
    title: 'Risk & Lot Size Calculators',
    subtitle: 'Position sizing, compounding, Kelly criterion & risk of ruin',
  },
  market: {
    title: 'Live Market Watch',
    subtitle: 'Real-time WebSocket tick stream, spreads & order book status',
  },
  strategies: {
    title: 'Strategy & Edge Analysis',
    subtitle: 'Win rate, profit factor and expectancy per setup',
  },
  goals: {
    title: 'Trading Goals & Discipline',
    subtitle: 'Target milestones, max drawdown limits and rule tracking',
  },
  settings: {
    title: 'Terminal Settings',
    subtitle: 'Accounts, currency, timezone & security management',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenTradeModal,
  openTradesCount,
  marketStatus,
  isAuthenticated = true,
  onOpenResetPin,
}) => {
  const info = TAB_TITLES[currentTab] || {
    title: 'ManKatFx Terminal',
    subtitle: 'Trading Journal & Analytics SaaS',
  };

  return (
    <header className="sticky top-0 z-30 bg-[#090909]/95 backdrop-blur-xl border-b border-[#1E1E1E] px-3 sm:px-8 py-2.5 sm:py-3.5 shadow-lg select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left Side: Brand Emblem & Realtime Connectivity Badges */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <BrandLogo size="sm" withText={false} usePng={true} pngSrc="/logo.png" className="shrink-0" />

          {/* Supabase Live Replication */}
          {isAuthenticated && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-bold text-emerald-400 shadow-sm"
              title="Supabase PostgreSQL Realtime Channel Active"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hidden sm:inline">
                <ScrambleText text="LIVE SYNC" duration={350} triggerKey={currentTab} />
              </span>
            </div>
          )}

          {/* Market Stream Live Pulse */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#141414] border border-[#242424] text-xs shadow-sm">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  marketStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  marketStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-zinc-300 font-mono text-[11px] flex items-center gap-1">
              <Wifi className="w-3 h-3 text-zinc-400" />
              <span>
                <ScrambleText
                  text={marketStatus === 'CONNECTED' ? 'Binance Stream' : 'Connecting'}
                  triggerKey={marketStatus}
                />
              </span>
            </span>
          </div>
        </div>

        {/* Center: Prominent Centered Title & Subtitle with Luxury Gold Gradient */}
        <div className="flex-1 text-center min-w-0 px-2">
          <div className="inline-flex items-center justify-center gap-2 max-w-full">
            <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-tight bg-gradient-to-r from-[#FFF5D6] via-[#D4AF37] to-[#B39226] bg-clip-text text-transparent truncate drop-shadow-sm">
              <ScrambleText text={info.title} duration={380} triggerKey={currentTab} />
            </h1>
            {openTradesCount > 0 && (
              <span className="text-[10px] hidden sm:inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0 font-mono">
                <RollingNumber value={openTradesCount} decimals={0} triggerKey={currentTab} />
                <ScrambleText text="Active" triggerKey={currentTab} />
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block mt-0.5 font-medium tracking-wide truncate">
            <ScrambleText text={info.subtitle} duration={480} triggerKey={currentTab} />
          </p>
        </div>

        {/* Right Side: Quick Action CTA Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* PIN Lock Settings */}
          {isAuthenticated && onOpenResetPin && (
            <button
              onClick={onOpenResetPin}
              title="Reset 4-Digit Security PIN"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161616] border border-[#282828] text-zinc-300 hover:text-amber-400 hover:border-amber-500/30 text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <ScrambleText text="PIN Lock" />
            </button>
          )}

          {/* Quick Log Trade Primary Button */}
          <button
            onClick={onOpenTradeModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#F2D675] via-[#D4AF37] to-[#B89428] text-[#090909] font-black text-xs shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            <span className="hidden xs:inline tracking-wide">
              <ScrambleText text="Log Trade" />
            </span>
            <span className="xs:hidden">
              <ScrambleText text="Log" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
