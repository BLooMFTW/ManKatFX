import React from 'react';
import {
  X,
  History,
  FileText,
  Calculator,
  Activity,
  PieChart,
  Target,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { TradingAccount } from '../../types/trade';
import { BrandLogo } from '../ui/BrandLogo';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  accounts: TradingAccount[];
  activeAccount: TradingAccount | null;
  onSelectAccount: (acc: TradingAccount) => void;
  userEmail?: string | null;
  onLogout: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  accounts,
  activeAccount,
  onSelectAccount,
  userEmail,
  onLogout,
}) => {
  if (!isOpen) return null;

  const tools = [
    { id: 'backtest' as NavTab, label: 'Backtest Suite & Engine', icon: FlaskConical },
    { id: 'history' as NavTab, label: 'Trade History & Ledger', icon: History },
    { id: 'reports' as NavTab, label: 'Monthly Reports', icon: FileText },
    { id: 'calculators' as NavTab, label: 'Risk & Lot Calculators', icon: Calculator },
    { id: 'market' as NavTab, label: 'Live Market Watch', icon: Activity },
    { id: 'strategies' as NavTab, label: 'Strategy Playbook', icon: PieChart },
    { id: 'goals' as NavTab, label: 'Goals & Discipline', icon: Target },
    { id: 'settings' as NavTab, label: 'Terminal Settings', icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-full max-h-[85vh] bg-[#121212] border-t border-[#2A2A2A] rounded-t-3xl overflow-y-auto p-5 z-10 shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#222]">
            <BrandLogo size="sm" withText withTagline tagline="Institutional Menu" badge="PRO" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Single Active Portfolio Card */}
          {activeAccount && (
            <div className="py-3 border-b border-[#222]">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                Active Portfolio
              </label>
              <div className="w-full bg-[#181818] border border-[#2B2B2B] text-zinc-200 text-xs rounded-xl px-3 py-2 flex items-center justify-between font-mono">
                <div className="truncate mr-2 text-left">
                  <span className="font-bold text-zinc-100 block truncate">{activeAccount.name}</span>
                  <span className="text-[10px] text-zinc-500">{activeAccount.broker} • #{activeAccount.accountNumber || 'Primary'}</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 shrink-0">
                  {activeAccount.currency}
                </span>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <div className="py-3 space-y-1">
            {tools.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-300 hover:bg-[#181818]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              );
            })}
          </div>
        </div>

        {/* User Footer */}
        <div className="pt-3 border-t border-[#222] flex items-center justify-between">
          <div className="text-xs">
            <p className="font-semibold text-zinc-200 truncate max-w-[200px]">{userEmail}</p>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Encrypted Supabase Live
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
