import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  History,
  TrendingUp,
  Calendar,
  FileText,
  Calculator,
  Activity,
  Target,
  Settings,
  PieChart,
  LogOut,
  ShieldCheck,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { TradingAccount } from '../../types/trade';
import { ScrambleText } from '../ui/ScrambleText';
import { RollingNumber } from '../ui/RollingNumber';
import { BrandLogo } from '../ui/BrandLogo';

export type NavTab =
  | 'overview'
  | 'journal'
  | 'history'
  | 'backtest'
  | 'analytics'
  | 'calendar'
  | 'reports'
  | 'calculators'
  | 'market'
  | 'strategies'
  | 'goals'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  accounts: TradingAccount[];
  activeAccount: TradingAccount | null;
  onSelectAccount: (acc: TradingAccount) => void;
  userEmail?: string | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  accounts,
  activeAccount,
  onSelectAccount,
  userEmail,
  onLogout,
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'journal' as NavTab, label: 'Trading Journal', icon: BookOpen },
    { id: 'history' as NavTab, label: 'Trade History', icon: History },
    { id: 'backtest' as NavTab, label: 'Backtest Suite', icon: FlaskConical },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: TrendingUp },
    { id: 'calendar' as NavTab, label: 'Calendar', icon: Calendar },
    { id: 'reports' as NavTab, label: 'Reports', icon: FileText },
    { id: 'calculators' as NavTab, label: 'Risk & Lot Calculators', icon: Calculator },
    { id: 'market' as NavTab, label: 'Market Watch', icon: Activity },
    { id: 'strategies' as NavTab, label: 'Strategy Analysis', icon: PieChart },
    { id: 'goals' as NavTab, label: 'Goals', icon: Target },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0D0D0D] border-r border-[#202020] h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1A1A1A]">
        <BrandLogo size="md" withText withTagline badge="PRO" />

        {/* Single Active Portfolio Card */}
        {activeAccount && (
          <div className="mt-4 pt-3 border-t border-[#1C1C1C]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">
                <ScrambleText text="Active Portfolio" />
              </label>
              <span className="text-[11px] font-mono text-amber-300 font-bold">
                <RollingNumber
                  value={activeAccount.currentBalance || activeAccount.initialBalance}
                  prefix="$"
                  triggerKey={currentTab}
                />
              </span>
            </div>
            <div className="w-full bg-[#151515] border border-[#272727] text-zinc-200 text-xs rounded-xl px-3 py-2 flex items-center justify-between font-mono">
              <div className="truncate mr-2 text-left">
                <span className="font-bold text-zinc-100 block truncate text-xs">{activeAccount.name}</span>
                <span className="text-[10px] text-zinc-500">{activeAccount.broker} • #{activeAccount.accountNumber || 'Primary'}</span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 shrink-0">
                {activeAccount.currency}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/15 to-transparent text-amber-300 border-l-2 border-[#D4AF37] font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#151515]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-zinc-400'}`}
                />
                <span>
                  <ScrambleText text={item.label} triggerKey={currentTab} duration={350} />
                </span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-[#1C1C1C] bg-[#0A0A0A]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#141414] border border-[#222222]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-semibold shrink-0">
              {userEmail ? userEmail[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">
                {userEmail || 'Trader'}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>
                  <ScrambleText text="Encrypted Live" duration={400} />
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            aria-label="Logout"
            title="Sign out"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
