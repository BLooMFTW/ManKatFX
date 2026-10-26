/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { onAuthChange, signOutUser } from './lib/supabase/authService';
import {
  fetchAccounts,
  saveAccount,
  fetchTrades,
  saveTrade,
  deleteTrade,
  fetchStrategies,
  saveStrategy,
  deleteStrategy,
  fetchGoals,
  saveGoal,
  deleteGoal,
  fetchBacktests,
  saveBacktest,
  deleteBacktest,
  resetBacktests,
  seedInitialUserData,
} from './lib/supabase/dbService';
import { subscribeToRealtimeSync, RealtimeChangePayload } from './lib/supabase/realtimeService';
import { marketService } from './lib/market/marketService';
import {
  Trade,
  TradingAccount,
  TradingStrategy,
  TradingGoal,
  BacktestTrade,
} from './types/trade';
import {
  DEFAULT_DEMO_ACCOUNT,
  DEFAULT_DEMO_STRATEGIES,
  DEFAULT_DEMO_GOALS,
} from './lib/sampleData';

// Navigation & Frame Components
import { Sidebar, NavTab } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { MobileNav } from './components/navigation/MobileNav';
import { MobileMenuDrawer } from './components/navigation/MobileMenuDrawer';

// Modals & Gates
import { LoginGate } from './components/auth/LoginGate';
import { PinLockGate } from './components/auth/PinLockGate';
import { ResetPinModal } from './components/auth/ResetPinModal';
import { TradeEntryModal } from './components/forms/TradeEntryModal';
import { TradeDetailModal } from './components/journal/TradeDetailModal';
import { TradingQuoteModal } from './components/ui/TradingQuoteModal';
import { PullToRefresh } from './components/ui/PullToRefresh';

// Views
import { OverviewView } from './components/dashboard/OverviewView';
import { JournalView } from './components/journal/JournalView';
import { BacktestView } from './components/backtest/BacktestView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CalendarView } from './components/calendar/CalendarView';
import { ReportsView } from './components/reports/ReportsView';
import { CalculatorsView } from './components/calculators/CalculatorsView';
import { MarketWatchView } from './components/market/MarketWatchView';
import { StrategyView } from './components/strategies/StrategyView';
import { GoalsView } from './components/goals/GoalsView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Strict 4-Digit Passcode Session Gate
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [isResetPinOpen, setIsResetPinOpen] = useState(false);

  // Legendary Trader Quotes Modal (Pops up for 3s after unlocking PIN)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data
  const [accounts, setAccounts] = useState<TradingAccount[]>([DEFAULT_DEMO_ACCOUNT]);
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(DEFAULT_DEMO_ACCOUNT);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<TradingStrategy[]>(DEFAULT_DEMO_STRATEGIES);
  const [goals, setGoals] = useState<TradingGoal[]>(DEFAULT_DEMO_GOALS);
  const [backtests, setBacktests] = useState<BacktestTrade[]>([]);

  // Modals
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Market stream status (100% Free Binance Stream & Interbank)
  const [marketStatus, setMarketStatus] = useState<
    'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'OFFLINE'
  >('CONNECTED');

  // Load user data from Supabase / Local storage
  const loadUserData = useCallback(async (user: User) => {
    try {
      const accs = await fetchAccounts(user.id);
      let primaryAcc: TradingAccount;
      if (accs.length === 0) {
        await seedInitialUserData(user.id);
        const seededAccs = await fetchAccounts(user.id);
        primaryAcc = seededAccs[0] || {
          ...DEFAULT_DEMO_ACCOUNT,
          id: `acc_${user.id.substring(0, 8)}`,
          userId: user.id,
        };
      } else {
        primaryAcc = accs[0];
      }
      setAccounts([primaryAcc]);
      setActiveAccount(primaryAcc);

      const [trds, strats, gls, bts] = await Promise.all([
        fetchTrades(user.id),
        fetchStrategies(user.id),
        fetchGoals(user.id),
        fetchBacktests(user.id),
      ]);

      setTrades(trds);
      setStrategies(strats.length > 0 ? strats : DEFAULT_DEMO_STRATEGIES);
      setGoals(gls.length > 0 ? gls : DEFAULT_DEMO_GOALS);
      setBacktests(bts);
    } catch (err) {
      console.error('Error loading Supabase user data:', err);
    }
  }, []);

  // Monitor Supabase Auth changes
  useEffect(() => {
    const unsub = onAuthChange((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        loadUserData(user);
      } else {
        setIsPinUnlocked(false);
        setIsQuoteModalOpen(false);
        setTrades([]);
        setBacktests([]);
      }
    });

    return () => unsub();
  }, [loadUserData]);

  // Realtime Subscriptions for Bidirectional Sync
  useEffect(() => {
    if (!currentUser) return;

    const unsubRealtime = subscribeToRealtimeSync(currentUser.id, (payload: RealtimeChangePayload) => {
      const { table, eventType, newRecord, oldRecord } = payload;

      if (table === 'trades') {
        if (eventType === 'INSERT') {
          setTrades((prev) => {
            if (prev.some((t) => t.id === newRecord.id)) return prev;
            return [mapRowToTrade(newRecord), ...prev];
          });
        } else if (eventType === 'UPDATE') {
          const updated = mapRowToTrade(newRecord);
          setTrades((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        } else if (eventType === 'DELETE' && oldRecord) {
          setTrades((prev) => prev.filter((t) => t.id !== oldRecord.id));
        }
      } else if (table === 'accounts') {
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const updatedAcc: TradingAccount = {
            id: newRecord.id,
            userId: newRecord.user_id,
            name: newRecord.name,
            broker: newRecord.broker,
            currency: newRecord.currency,
            initialBalance: Number(newRecord.initial_balance),
            currentBalance: Number(newRecord.current_balance),
            isDefault: newRecord.is_default,
            createdAt: newRecord.created_at,
          };
          setAccounts((prev) => {
            const idx = prev.findIndex((a) => a.id === updatedAcc.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updatedAcc;
              return copy;
            }
            return [...prev, updatedAcc];
          });
        }
      } else if (table === 'backtests') {
        if (eventType === 'INSERT') {
          setBacktests((prev) => {
            if (prev.some((b) => b.id === newRecord.id)) return prev;
            return [mapRowToBacktest(newRecord), ...prev];
          });
        } else if (eventType === 'UPDATE') {
          const updatedBt = mapRowToBacktest(newRecord);
          setBacktests((prev) => prev.map((b) => (b.id === updatedBt.id ? updatedBt : b)));
        } else if (eventType === 'DELETE' && oldRecord) {
          setBacktests((prev) => prev.filter((b) => b.id !== oldRecord.id));
        }
      }
    });

    return () => unsubRealtime();
  }, [currentUser]);

  // Monitor Market Stream status
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(marketService.connectionStatus);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Trading Data Operations
  const handleSaveTrade = async (trade: Trade) => {
    if (!currentUser) return;
    trade.userId = currentUser.id;
    if (!trade.accountId && activeAccount) {
      trade.accountId = activeAccount.id;
    }

    setTrades((prev) => {
      const idx = prev.findIndex((t) => t.id === trade.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = trade;
        return updated;
      }
      return [trade, ...prev];
    });

    try {
      await saveTrade(trade);
    } catch (err) {
      console.error('Failed to sync trade to Supabase:', err);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== tradeId));
    if (selectedTrade?.id === tradeId) setSelectedTrade(null);
    try {
      await deleteTrade(tradeId);
    } catch (err) {
      console.error('Failed to delete trade from Supabase:', err);
    }
  };

  const handleDuplicateTrade = (trade: Trade) => {
    setEditingTrade({
      ...trade,
      id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      entryDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
    setIsTradeModalOpen(true);
  };

  const handleImportTrades = async (importedList: Trade[]) => {
    if (!currentUser) return;
    for (const t of importedList) {
      t.userId = currentUser.id;
      if (!t.accountId && activeAccount) t.accountId = activeAccount.id;
      await saveTrade(t);
    }
    setTrades((prev) => [...importedList, ...prev]);
  };

  // Backtest Handlers
  const handleSaveBacktest = async (bt: BacktestTrade) => {
    if (!currentUser) return;
    bt.userId = currentUser.id;

    setBacktests((prev) => {
      const idx = prev.findIndex((b) => b.id === bt.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = bt;
        return copy;
      }
      return [bt, ...prev];
    });

    await saveBacktest(bt);
  };

  const handleDeleteBacktest = async (tradeId: string) => {
    if (!currentUser) return;
    setBacktests((prev) => prev.filter((b) => b.id !== tradeId));
    await deleteBacktest(tradeId, currentUser.id);
  };

  const handleResetBacktests = async () => {
    if (!currentUser) return;
    setBacktests([]);
    await resetBacktests(currentUser.id);
  };

  const handleSaveStrategy = async (strategy: TradingStrategy) => {
    if (!currentUser) return;
    strategy.userId = currentUser.id;
    setStrategies((prev) => {
      const idx = prev.findIndex((s) => s.id === strategy.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = strategy;
        return updated;
      }
      return [...prev, strategy];
    });
    await saveStrategy(strategy);
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== strategyId));
    await deleteStrategy(strategyId);
  };

  const handleSaveGoal = async (goal: TradingGoal) => {
    if (!currentUser) return;
    goal.userId = currentUser.id;
    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === goal.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = goal;
        return updated;
      }
      return [...prev, goal];
    });
    await saveGoal(goal);
  };

  const handleDeleteGoal = async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    await deleteGoal(goalId);
  };

  const handleSaveAccount = async (acc: TradingAccount) => {
    if (!currentUser) return;
    acc.userId = currentUser.id;
    setActiveAccount(acc);
    setAccounts([acc]);
    await saveAccount(acc);
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setIsPinUnlocked(false);
    setIsQuoteModalOpen(false);
  };

  // Pull-to-refresh data synchronizer
  const handleRefreshAll = useCallback(async () => {
    if (currentUser) {
      await loadUserData(currentUser);
    }
  }, [currentUser, loadUserData]);

  // 1. Initial Auth Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center text-zinc-100 p-6 selection:bg-[#D4AF37] selection:text-black">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F2D675] via-[#D4AF37] to-[#8C6D1F] flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-4 animate-pulse">
          <span className="font-extrabold text-black text-2xl tracking-tighter">M</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping" />
          <span>INITIALIZING ENCRYPTED TERMINAL...</span>
        </div>
      </div>
    );
  }

  // 2. Strict Authentication Gate (Only Login options)
  if (!currentUser) {
    return (
      <LoginGate
        onLoginSuccess={(u) => {
          if (u) {
            setCurrentUser(u);
            loadUserData(u);
          }
        }}
      />
    );
  }

  // 3. Strict 4-Digit Passcode Gate: Required every time page reloads
  if (!isPinUnlocked) {
    return (
      <PinLockGate
        user={currentUser}
        onUnlock={() => {
          setIsPinUnlocked(true);
          // Show 3-second motivational trading quote modal
          setIsQuoteModalOpen(true);
        }}
        onLogout={handleLogout}
      />
    );
  }

  const openTradesCount = trades.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-[#090909] text-zinc-100 flex flex-col lg:flex-row antialiased selection:bg-[#D4AF37] selection:text-black">
      {/* Desktop Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={setActiveAccount}
        userEmail={currentUser.email}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Header */}
        <TopBar
          currentTab={currentTab}
          onOpenTradeModal={() => {
            setEditingTrade(null);
            setIsTradeModalOpen(true);
          }}
          openTradesCount={openTradesCount}
          marketStatus={marketStatus}
          isAuthenticated={true}
          onOpenResetPin={() => setIsResetPinOpen(true)}
          isRealtimeActive={true}
        />

        {/* Pull To Refresh Mobile Wrapper */}
        <PullToRefresh onRefresh={handleRefreshAll}>
          {/* View Router */}
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentTab === 'overview' && (
              <OverviewView
                trades={trades}
                activeAccount={activeAccount}
                onOpenTradeModal={() => {
                  setEditingTrade(null);
                  setIsTradeModalOpen(true);
                }}
                onSelectTrade={(t) => setSelectedTrade(t)}
              />
            )}

            {currentTab === 'journal' && (
              <JournalView
                trades={trades}
                onOpenTradeModal={() => {
                  setEditingTrade(null);
                  setIsTradeModalOpen(true);
                }}
                onEditTrade={(t) => {
                  setEditingTrade(t);
                  setIsTradeModalOpen(true);
                }}
                onDuplicateTrade={handleDuplicateTrade}
                onDeleteTrade={handleDeleteTrade}
                onSelectTrade={(t) => setSelectedTrade(t)}
                onImportTrades={handleImportTrades}
                currentUserId={currentUser.id}
                currentAccountId={activeAccount?.id || 'acc_default'}
              />
            )}

            {currentTab === 'history' && (
              <JournalView
                trades={trades}
                onOpenTradeModal={() => {
                  setEditingTrade(null);
                  setIsTradeModalOpen(true);
                }}
                onEditTrade={(t) => {
                  setEditingTrade(t);
                  setIsTradeModalOpen(true);
                }}
                onDuplicateTrade={handleDuplicateTrade}
                onDeleteTrade={handleDeleteTrade}
                onSelectTrade={(t) => setSelectedTrade(t)}
                onImportTrades={handleImportTrades}
                currentUserId={currentUser.id}
                currentAccountId={activeAccount?.id || 'acc_default'}
              />
            )}

            {currentTab === 'backtest' && (
              <BacktestView
                backtests={backtests}
                onSaveBacktest={handleSaveBacktest}
                onDeleteBacktest={handleDeleteBacktest}
                onResetBacktests={handleResetBacktests}
                userId={currentUser.id}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsView trades={trades} activeAccount={activeAccount} />
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                trades={trades}
                onSelectTrade={(t) => setSelectedTrade(t)}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView trades={trades} activeAccount={activeAccount} />
            )}

            {currentTab === 'calculators' && (
              <CalculatorsView initialBalance={activeAccount?.initialBalance || 25000} />
            )}

            {currentTab === 'market' && <MarketWatchView />}

            {currentTab === 'strategies' && (
              <StrategyView
                strategies={strategies}
                trades={trades}
                onSaveStrategy={handleSaveStrategy}
                onDeleteStrategy={handleDeleteStrategy}
              />
            )}

            {currentTab === 'goals' && (
              <GoalsView
                goals={goals}
                onSaveGoal={handleSaveGoal}
                onDeleteGoal={handleDeleteGoal}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                accounts={accounts}
                activeAccount={activeAccount}
                onSaveAccount={handleSaveAccount}
                userEmail={currentUser.email}
                trades={trades}
                onSeedDemoData={async () => {}}
                onOpenResetPin={() => setIsResetPinOpen(true)}
              />
            )}
          </main>
        </PullToRefresh>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Mobile Secondary Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={setActiveAccount}
        userEmail={currentUser.email}
        onLogout={handleLogout}
      />

      {/* Trade Entry Modal */}
      <TradeEntryModal
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveTrade}
        editingTrade={editingTrade}
        accounts={accounts}
        strategies={strategies}
        activeAccountId={activeAccount?.id || ''}
      />

      {/* Trade Detail Inspector Modal */}
      <TradeDetailModal
        isOpen={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
        trade={selectedTrade}
        onEdit={(t) => {
          setEditingTrade(t);
          setIsTradeModalOpen(true);
        }}
        onDuplicate={handleDuplicateTrade}
        onDelete={handleDeleteTrade}
      />

      {/* Reset 4-Digit Passcode Modal */}
      <ResetPinModal
        isOpen={isResetPinOpen}
        onClose={() => setIsResetPinOpen(false)}
        user={currentUser}
      />

      {/* 3-Second Legendary Trader Quote Modal */}
      <TradingQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
}

// Helpers for Realtime record mapping
function mapRowToTrade(row: any): Trade {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    symbol: row.symbol,
    assetClass: row.asset_class,
    direction: row.direction,
    status: row.status,
    entryDate: row.entry_date,
    entryTime: row.entry_time || '09:00',
    exitDate: row.exit_date,
    exitTime: row.exit_time,
    session: row.session,
    entryPrice: Number(row.entry_price),
    exitPrice: row.exit_price ? Number(row.exit_price) : undefined,
    stopLoss: row.stop_loss ? Number(row.stop_loss) : undefined,
    takeProfit: row.take_profit ? Number(row.take_profit) : undefined,
    quantity: Number(row.quantity),
    lotSize: row.lot_size ? Number(row.lot_size) : undefined,
    contractMultiplier: row.contract_multiplier ? Number(row.contract_multiplier) : 1,
    riskPercentage: row.risk_percentage ? Number(row.risk_percentage) : 1,
    commission: Number(row.commission || 0),
    swap: Number(row.swap || 0),
    grossPnL: Number(row.gross_pnl || 0),
    netPnL: Number(row.net_pnl || 0),
    plannedRR: row.planned_rr ? Number(row.planned_rr) : undefined,
    realizedRR: row.realized_rr ? Number(row.realized_rr) : undefined,
    strategy: row.strategy,
    setupType: row.setup_type,
    entryReason: row.entry_reason,
    exitReason: row.exit_reason,
    emotionBefore: row.emotion_before,
    emotionAfter: row.emotion_after,
    ruleFollowingScore: row.rule_following_score ? Number(row.rule_following_score) : 5,
    mistakes: row.mistakes,
    lessons: row.lessons,
    tags: Array.isArray(row.tags) ? row.tags : (row.tags ? row.tags.split(',') : []),
    screenshotUrl: row.screenshot_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToBacktest(row: any): BacktestTrade {
  return {
    id: row.id,
    userId: row.user_id,
    pair: row.pair,
    direction: row.direction,
    timeframe: row.timeframe || '15m',
    entryDate: row.entry_date,
    entryPrice: Number(row.entry_price),
    exitPrice: Number(row.exit_price),
    stopLoss: Number(row.stop_loss),
    takeProfit: Number(row.take_profit),
    plannedRR: Number(row.planned_rr || 2),
    realizedRR: Number(row.realized_rr || 0),
    outcome: row.outcome,
    pnlR: Number(row.realized_rr || 0),
    strategy: row.strategy,
    setupType: row.setup_type,
    session: row.session,
    notes: row.notes,
    screenshotUrl: row.screenshot_url,
    createdAt: row.created_at,
  };
}
