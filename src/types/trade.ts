export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type AssetClass = 'FOREX' | 'CRYPTO' | 'INDICES' | 'COMMODITIES' | 'METALS' | 'STOCKS';
export type MarketSession = 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP';

export interface Trade {
  id: string;
  userId: string;
  accountId: string;
  symbol: string;
  assetClass: AssetClass;
  direction: TradeDirection;
  status: TradeStatus;
  entryDate: string; // YYYY-MM-DD
  entryTime: string; // HH:mm
  exitDate?: string;
  exitTime?: string;
  session?: MarketSession;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number;
  lotSize?: number;
  contractMultiplier?: number;
  riskPercentage?: number;
  commission: number;
  swap: number;
  grossPnL: number;
  netPnL: number;
  plannedRR?: number;
  realizedRR?: number;
  strategy?: string;
  setupType?: string;
  entryReason?: string;
  exitReason?: string;
  emotionBefore?: 'CONFIDENT' | 'CALM' | 'FOMO' | 'HESITANT' | 'REVENGE';
  emotionAfter?: 'SATISFIED' | 'DISCIPLINED' | 'GREEDY' | 'FRUSTRATED' | 'RELIEVED';
  ruleFollowingScore?: number; // 1 to 5 or percentage
  mistakes?: string;
  lessons?: string;
  tags?: string[];
  screenshotUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradingAccount {
  id: string;
  userId: string;
  name: string;
  broker: string;
  accountNumber?: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isDefault?: boolean;
  createdAt: string;
}

export interface TradingStrategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  rules: string;
  timeframe: string;
  targetRR: number;
  createdAt: string;
}

export interface TradingGoal {
  id: string;
  userId: string;
  title: string;
  category: 'RETURN' | 'DRAWDOWN' | 'WIN_RATE' | 'RULES' | 'VOLUME';
  targetValue: number;
  currentValue: number;
  unit: '%' | '$' | 'trades' | 'score';
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  completed: boolean;
  createdAt: string;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  symbols: string[];
  updatedAt: string;
}

export interface MonthlyReport {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  accountId: string;
  startingBalance: number;
  endingBalance: number;
  netPnL: number;
  returnPercent: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  bestTrade?: string;
  worstTrade?: string;
  bestStrategy?: string;
  ruleAdherence: number;
  keyLessons?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  defaultCurrency: string;
  timezone: string;
  defaultRiskPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceStats {
  startingBalance: number;
  currentBalance: number;
  currentEquity: number;
  totalNetPnL: number;
  grossProfit: number;
  grossLoss: number;
  returnPercent: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  averageRR: number;
  expectancy: number;
  payoffRatio: number;
  maxDrawdownCash: number;
  maxDrawdownPercent: number;
  recoveryFactor: number;
  winStreak: number;
  lossStreak: number;
  longWinRate: number;
  shortWinRate: number;
  longCount: number;
  shortCount: number;
  avgHoldingTimeMinutes: number;
  ruleFollowingRate: number;
}

export interface BacktestTrade {
  id: string;
  userId: string;
  pair: string;
  direction: TradeDirection;
  timeframe: string;
  entryDate: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  plannedRR: number;
  realizedRR: number;
  outcome: 'WIN' | 'LOSS' | 'BE';
  pnlR?: number;
  strategy?: string;
  setupType?: string;
  session?: MarketSession;
  notes?: string;
  screenshotUrl?: string;
  createdAt: string;
}
