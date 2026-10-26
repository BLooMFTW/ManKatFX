import { getSupabase } from './client';
import {
  Trade,
  TradingAccount,
  TradingStrategy,
  TradingGoal,
} from '../../types/trade';
import {
  DEFAULT_DEMO_ACCOUNT,
  DEFAULT_DEMO_STRATEGIES,
  DEFAULT_DEMO_GOALS,
  DEFAULT_DEMO_TRADES,
} from '../sampleData';

const LOCAL_KEY_TRADES = (uid: string) => `mankatfx_trades_${uid}`;
const LOCAL_KEY_ACCOUNTS = (uid: string) => `mankatfx_accounts_${uid}`;
const LOCAL_KEY_STRATEGIES = (uid: string) => `mankatfx_strategies_${uid}`;
const LOCAL_KEY_GOALS = (uid: string) => `mankatfx_goals_${uid}`;
const LOCAL_KEY_BACKTESTS = (uid: string) => `mankatfx_backtests_${uid}`;

/* ------------------- ACCOUNTS ------------------- */

export async function fetchAccounts(userId: string): Promise<TradingAccount[]> {
  const localKey = LOCAL_KEY_ACCOUNTS(userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  let cached: TradingAccount[] = localData ? JSON.parse(localData) : [];

  if (cached.length === 0 && (userId === 'demo' || userId === 'demo_user_inst')) {
    cached = [{ ...DEFAULT_DEMO_ACCOUNT, userId }];
    if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(cached));
  }

  const supabase = getSupabase();
  if (!supabase) return cached;

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data) return cached;

    const mapped = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      broker: row.broker,
      accountNumber: row.account_number,
      currency: row.currency,
      initialBalance: Number(row.initial_balance),
      currentBalance: Number(row.current_balance),
      isDefault: row.is_default,
      createdAt: row.created_at,
    }));

    if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(mapped));
    return mapped;
  } catch {
    return cached;
  }
}

export async function saveAccount(account: TradingAccount): Promise<void> {
  const localKey = LOCAL_KEY_ACCOUNTS(account.userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  const current: TradingAccount[] = localData ? JSON.parse(localData) : [];
  const idx = current.findIndex((a) => a.id === account.id);
  if (idx >= 0) {
    current[idx] = account;
  } else {
    current.push(account);
  }
  if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(current));

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const row = {
      id: account.id,
      user_id: account.userId,
      name: account.name,
      broker: account.broker,
      account_number: account.accountNumber || null,
      currency: account.currency,
      initial_balance: account.initialBalance,
      current_balance: account.currentBalance,
      is_default: Boolean(account.isDefault),
      updated_at: new Date().toISOString(),
    };
    await supabase.from('accounts').upsert(row);
  } catch (err: any) {
    console.warn('Supabase saveAccount notice:', err?.message);
  }
}

export async function deleteAccount(accountId: string, userId?: string): Promise<void> {
  if (userId && typeof window !== 'undefined') {
    const localKey = LOCAL_KEY_ACCOUNTS(userId);
    const localData = localStorage.getItem(localKey);
    if (localData) {
      const current: TradingAccount[] = JSON.parse(localData);
      localStorage.setItem(localKey, JSON.stringify(current.filter((a) => a.id !== accountId)));
    }
  }

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('accounts').delete().eq('id', accountId);
  } catch (err: any) {
    console.warn('Supabase deleteAccount notice:', err?.message);
  }
}

/* ------------------- TRADES ------------------- */

export async function fetchTrades(userId: string): Promise<Trade[]> {
  const localKey = LOCAL_KEY_TRADES(userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  let cached: Trade[] = localData ? JSON.parse(localData) : [];

  // Seed rich demo trades for demo user if local store is empty
  if (cached.length === 0 && (userId === 'demo' || userId === 'demo_user_inst')) {
    cached = DEFAULT_DEMO_TRADES.map((t) => ({ ...t, userId }));
    if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(cached));
  }

  const supabase = getSupabase();
  if (!supabase) return cached;

  try {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    if (error || !data) return cached;

    const mapped: Trade[] = data.map((row: any) => ({
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
    }));

    if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(mapped));
    return mapped;
  } catch {
    return cached;
  }
}

export async function saveTrade(trade: Trade): Promise<void> {
  const localKey = LOCAL_KEY_TRADES(trade.userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  const current: Trade[] = localData ? JSON.parse(localData) : [];
  const idx = current.findIndex((t) => t.id === trade.id);
  if (idx >= 0) {
    current[idx] = trade;
  } else {
    current.unshift(trade);
  }
  if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(current));

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // Ensure user account exists in accounts table first to satisfy foreign key account_id
    const { data: existingAcc } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', trade.accountId)
      .maybeSingle();

    if (!existingAcc) {
      await supabase.from('accounts').upsert({
        id: trade.accountId,
        user_id: trade.userId,
        name: 'Primary Trading Account',
        broker: 'IC Markets',
        currency: 'USD',
        initial_balance: 25000,
        current_balance: 25000,
        is_default: true,
      });
    }

    const row = {
      id: trade.id,
      user_id: trade.userId,
      account_id: trade.accountId,
      symbol: trade.symbol,
      asset_class: trade.assetClass,
      direction: trade.direction,
      status: trade.status,
      entry_date: trade.entryDate,
      entry_time: trade.entryTime || '09:00',
      exit_date: trade.exitDate || null,
      exit_time: trade.exitTime || null,
      session: trade.session || null,
      entry_price: trade.entryPrice,
      exit_price: trade.exitPrice || null,
      stop_loss: trade.stopLoss || null,
      take_profit: trade.takeProfit || null,
      quantity: trade.quantity,
      lot_size: trade.lotSize || null,
      contract_multiplier: trade.contractMultiplier || 1,
      risk_percentage: trade.riskPercentage || 1,
      commission: trade.commission || 0,
      swap: trade.swap || 0,
      gross_pnl: trade.grossPnL || 0,
      net_pnl: trade.netPnL || 0,
      planned_rr: trade.plannedRR || null,
      realized_rr: trade.realizedRR || null,
      strategy: trade.strategy || null,
      setup_type: trade.setupType || null,
      entry_reason: trade.entryReason || null,
      exit_reason: trade.exitReason || null,
      emotion_before: trade.emotionBefore || null,
      emotion_after: trade.emotionAfter || null,
      rule_following_score: trade.ruleFollowingScore || 5,
      mistakes: trade.mistakes || null,
      lessons: trade.lessons || null,
      tags: trade.tags || [],
      screenshot_url: trade.screenshotUrl || null,
      notes: trade.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('trades').upsert(row);
    if (error) console.warn('Supabase saveTrade note:', error.message);
  } catch (err: any) {
    console.warn('Supabase saveTrade warning:', err?.message);
  }
}

export async function deleteTrade(tradeId: string, userId?: string): Promise<void> {
  if (typeof window !== 'undefined') {
    // Check all trade keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mankatfx_trades_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: Trade[] = JSON.parse(raw);
          const filtered = list.filter((t) => t.id !== tradeId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    }
  }

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('trades').delete().eq('id', tradeId);
  } catch (err: any) {
    console.warn('Supabase deleteTrade notice:', err?.message);
  }
}

/* ------------------- STRATEGIES ------------------- */

export async function fetchStrategies(userId: string): Promise<TradingStrategy[]> {
  const localKey = LOCAL_KEY_STRATEGIES(userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  let cached: TradingStrategy[] = localData ? JSON.parse(localData) : [];

  if (cached.length === 0) {
    cached = DEFAULT_DEMO_STRATEGIES.map((s) => ({ ...s, userId }));
    if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(cached));
  }

  const supabase = getSupabase();
  if (!supabase) return cached;

  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return cached;

    const mapped = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      rules: row.rules,
      timeframe: row.timeframe,
      targetRR: Number(row.target_rr || 2),
      createdAt: row.created_at,
    }));

    if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(mapped));
    return mapped;
  } catch {
    return cached;
  }
}

export async function saveStrategy(strategy: TradingStrategy): Promise<void> {
  const localKey = LOCAL_KEY_STRATEGIES(strategy.userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  const current: TradingStrategy[] = localData ? JSON.parse(localData) : [];
  const idx = current.findIndex((s) => s.id === strategy.id);
  if (idx >= 0) {
    current[idx] = strategy;
  } else {
    current.push(strategy);
  }
  if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(current));

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const row = {
      id: strategy.id,
      user_id: strategy.userId,
      name: strategy.name,
      description: strategy.description || '',
      rules: strategy.rules || '',
      timeframe: strategy.timeframe || '15m / 1H',
      target_rr: strategy.targetRR || 2,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('strategies').upsert(row);
  } catch (err: any) {
    console.warn('Supabase saveStrategy notice:', err?.message);
  }
}

export async function deleteStrategy(strategyId: string, userId?: string): Promise<void> {
  if (userId && typeof window !== 'undefined') {
    const localKey = LOCAL_KEY_STRATEGIES(userId);
    const localData = localStorage.getItem(localKey);
    if (localData) {
      const current: TradingStrategy[] = JSON.parse(localData);
      localStorage.setItem(localKey, JSON.stringify(current.filter((s) => s.id !== strategyId)));
    }
  }

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('strategies').delete().eq('id', strategyId);
  } catch (err: any) {
    console.warn('Supabase deleteStrategy notice:', err?.message);
  }
}

/* ------------------- GOALS ------------------- */

export async function fetchGoals(userId: string): Promise<TradingGoal[]> {
  const localKey = LOCAL_KEY_GOALS(userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  let cached: TradingGoal[] = localData ? JSON.parse(localData) : [];

  if (cached.length === 0) {
    cached = DEFAULT_DEMO_GOALS.map((g) => ({ ...g, userId }));
    if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(cached));
  }

  const supabase = getSupabase();
  if (!supabase) return cached;

  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return cached;

    const mapped = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      category: row.category,
      targetValue: Number(row.target_value),
      currentValue: Number(row.current_value),
      unit: row.unit,
      period: row.period,
      completed: Boolean(row.completed),
      createdAt: row.created_at,
    }));

    if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(mapped));
    return mapped;
  } catch {
    return cached;
  }
}

export async function saveGoal(goal: TradingGoal): Promise<void> {
  const localKey = LOCAL_KEY_GOALS(goal.userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  const current: TradingGoal[] = localData ? JSON.parse(localData) : [];
  const idx = current.findIndex((g) => g.id === goal.id);
  if (idx >= 0) {
    current[idx] = goal;
  } else {
    current.push(goal);
  }
  if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(current));

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const row = {
      id: goal.id,
      user_id: goal.userId,
      title: goal.title,
      category: goal.category,
      target_value: goal.targetValue,
      current_value: goal.currentValue,
      unit: goal.unit,
      period: goal.period,
      completed: Boolean(goal.completed),
      updated_at: new Date().toISOString(),
    };
    await supabase.from('goals').upsert(row);
  } catch (err: any) {
    console.warn('Supabase saveGoal notice:', err?.message);
  }
}

export async function deleteGoal(goalId: string, userId?: string): Promise<void> {
  if (userId && typeof window !== 'undefined') {
    const localKey = LOCAL_KEY_GOALS(userId);
    const localData = localStorage.getItem(localKey);
    if (localData) {
      const current: TradingGoal[] = JSON.parse(localData);
      localStorage.setItem(localKey, JSON.stringify(current.filter((g) => g.id !== goalId)));
    }
  }

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('goals').delete().eq('id', goalId);
  } catch (err: any) {
    console.warn('Supabase deleteGoal notice:', err?.message);
  }
}

/* ------------------- INITIAL SEEDING FOR NEW USER ------------------- */

export async function seedInitialUserData(userId: string): Promise<void> {
  const existing = await fetchAccounts(userId);
  if (existing.length > 0) return;

  const account = { ...DEFAULT_DEMO_ACCOUNT, id: `acc_${Date.now()}`, userId };
  await saveAccount(account);

  for (const s of DEFAULT_DEMO_STRATEGIES) {
    await saveStrategy({ ...s, id: `strat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, userId });
  }

  for (const g of DEFAULT_DEMO_GOALS) {
    await saveGoal({ ...g, id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, userId });
  }
}

/* ------------------- BACKTESTS ------------------- */

export async function fetchBacktests(userId: string): Promise<any[]> {
  const localKey = LOCAL_KEY_BACKTESTS(userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  const cached: any[] = localData ? JSON.parse(localData) : [];

  const supabase = getSupabase();
  if (!supabase) return cached;

  try {
    const { data, error } = await supabase
      .from('backtests')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    if (error || !data) return cached;

    const mapped = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      pair: row.pair,
      direction: row.direction,
      timeframe: row.timeframe,
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
    }));

    if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(mapped));
    return mapped;
  } catch (err) {
    console.warn('Backtest fetch note:', err);
    return cached;
  }
}

export async function saveBacktest(trade: any): Promise<void> {
  const localKey = LOCAL_KEY_BACKTESTS(trade.userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  const current: any[] = localData ? JSON.parse(localData) : [];
  const idx = current.findIndex((b) => b.id === trade.id);
  if (idx >= 0) {
    current[idx] = trade;
  } else {
    current.unshift(trade);
  }
  if (typeof window !== 'undefined') localStorage.setItem(localKey, JSON.stringify(current));

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const row = {
      id: trade.id,
      user_id: trade.userId,
      pair: trade.pair,
      direction: trade.direction,
      timeframe: trade.timeframe || '15m',
      entry_date: trade.entryDate,
      entry_price: trade.entryPrice,
      exit_price: trade.exitPrice,
      stop_loss: trade.stopLoss,
      take_profit: trade.takeProfit,
      planned_rr: trade.plannedRR || 2,
      realized_rr: trade.realizedRR || 0,
      outcome: trade.outcome,
      strategy: trade.strategy || null,
      setup_type: trade.setupType || null,
      session: trade.session || null,
      notes: trade.notes || null,
      screenshot_url: trade.screenshotUrl || null,
      created_at: trade.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('backtests').upsert(row);
    if (error) console.warn('Supabase backtests sync notice:', error.message);
  } catch (e) {
    console.warn('Supabase backtests table not yet created in PostgreSQL:', e);
  }
}

export async function deleteBacktest(tradeId: string, userId: string): Promise<void> {
  const localKey = LOCAL_KEY_BACKTESTS(userId);
  const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
  if (localData) {
    const current: any[] = JSON.parse(localData);
    const filtered = current.filter((b) => b.id !== tradeId);
    localStorage.setItem(localKey, JSON.stringify(filtered));
  }

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('backtests').delete().eq('id', tradeId);
  } catch (e) {
    console.warn('Supabase delete backtest notice:', e);
  }
}

export async function resetBacktests(userId: string): Promise<void> {
  const localKey = LOCAL_KEY_BACKTESTS(userId);
  if (typeof window !== 'undefined') localStorage.removeItem(localKey);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('backtests').delete().eq('user_id', userId);
  } catch (e) {
    console.warn('Supabase reset backtests notice:', e);
  }
}
