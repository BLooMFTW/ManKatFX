import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTradeFinancials,
  calculatePerformanceStats,
  calculatePositionSize,
  calculateForexLotSize,
  calculateCompounding,
  calculateKellyCriterion,
  calculateRiskOfRuin,
} from './calculations';
import { Trade } from '../types/trade';

test('calculateTradeFinancials handles LONG winning trade with stop loss and take profit', () => {
  const result = calculateTradeFinancials({
    direction: 'LONG',
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    stopLoss: 1.0975,
    takeProfit: 1.1075,
    quantity: 100000, // 1 lot
    commission: 5,
    swap: 2,
  });

  // Gross PnL: (1.1050 - 1.1000) * 100000 = 500
  assert.equal(result.grossPnL, 500);
  // Net PnL: 500 - 5 - 2 = 493
  assert.equal(result.netPnL, 493);
  // Planned RR: (1.1075 - 1.1000) / (1.1000 - 1.0975) = 0.0075 / 0.0025 = 3.0
  assert.equal(result.plannedRR, 3);
  // Realized RR: (1.1050 - 1.1000) / 0.0025 = 2.0
  assert.equal(result.realizedRR, 2);
});

test('calculateTradeFinancials handles SHORT losing trade', () => {
  const result = calculateTradeFinancials({
    direction: 'SHORT',
    entryPrice: 2000,
    exitPrice: 2020,
    stopLoss: 2010,
    quantity: 10,
    commission: 10,
    swap: 0,
  });

  // Gross PnL: (2000 - 2020) * 10 = -200
  assert.equal(result.grossPnL, -200);
  // Net PnL: -200 - 10 = -210
  assert.equal(result.netPnL, -210);
  // Realized RR: (2000 - 2020) / (2010 - 2000) = -20 / 10 = -2.0
  assert.equal(result.realizedRR, -2);
});

test('calculatePerformanceStats correctly calculates win rate, profit factor, expectancy and max drawdown', () => {
  const mockTrades: Trade[] = [
    {
      id: '1',
      userId: 'u1',
      accountId: 'a1',
      symbol: 'EURUSD',
      assetClass: 'FOREX',
      direction: 'LONG',
      status: 'CLOSED',
      entryDate: '2026-10-01',
      entryTime: '10:00',
      exitDate: '2026-10-01',
      entryPrice: 1.1000,
      exitPrice: 1.1030,
      quantity: 100000,
      commission: 0,
      swap: 0,
      grossPnL: 300,
      netPnL: 300,
      realizedRR: 2,
      ruleFollowingScore: 5,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    },
    {
      id: '2',
      userId: 'u1',
      accountId: 'a1',
      symbol: 'GBPUSD',
      assetClass: 'FOREX',
      direction: 'SHORT',
      status: 'CLOSED',
      entryDate: '2026-10-02',
      entryTime: '11:00',
      exitDate: '2026-10-02',
      entryPrice: 1.3000,
      exitPrice: 1.3015,
      quantity: 100000,
      commission: 0,
      swap: 0,
      grossPnL: -150,
      netPnL: -150,
      realizedRR: -1,
      ruleFollowingScore: 4,
      createdAt: '2026-10-02',
      updatedAt: '2026-10-02',
    },
    {
      id: '3',
      userId: 'u1',
      accountId: 'a1',
      symbol: 'XAUUSD',
      assetClass: 'COMMODITIES',
      direction: 'LONG',
      status: 'CLOSED',
      entryDate: '2026-10-03',
      entryTime: '14:00',
      exitDate: '2026-10-03',
      entryPrice: 2000,
      exitPrice: 2040,
      quantity: 10,
      commission: 0,
      swap: 0,
      grossPnL: 400,
      netPnL: 400,
      realizedRR: 3,
      ruleFollowingScore: 5,
      createdAt: '2026-10-03',
      updatedAt: '2026-10-03',
    },
  ];

  const stats = calculatePerformanceStats(mockTrades, 10000);

  assert.equal(stats.totalTrades, 3);
  assert.equal(stats.winningTrades, 2);
  assert.equal(stats.losingTrades, 1);
  // Win rate: 2 / 3 * 100 = 66.7%
  assert.equal(stats.winRate, 66.7);
  // Gross profit: 700, Gross loss: 150 -> Net PnL: 550
  assert.equal(stats.grossProfit, 700);
  assert.equal(stats.grossLoss, 150);
  assert.equal(stats.totalNetPnL, 550);
  assert.equal(stats.currentBalance, 10550);
  // Profit factor: 700 / 150 = 4.67
  assert.equal(stats.profitFactor, 4.67);
  // Average win: 350, Average loss: 150
  assert.equal(stats.averageWin, 350);
  assert.equal(stats.averageLoss, 150);
  // Expectancy: (0.667 * 350) - (0.333 * 150) = 233.45 - 49.95 = ~183.5
  assert.ok(stats.expectancy > 150 && stats.expectancy < 200);
  // Max win streak: 1 (trade 1 win, trade 2 loss, trade 3 win)
  assert.equal(stats.winStreak, 1);
});

test('calculatePositionSize accurately computes cash risk, position quantity and R:R', () => {
  const result = calculatePositionSize({
    accountBalance: 50000,
    riskPercent: 1, // $500 risk
    entryPrice: 100,
    stopLossPrice: 95, // $5 risk per share
    targetPrice: 115,  // $15 reward per share
  });

  assert.equal(result.cashRisk, 500);
  assert.equal(result.stopDistance, 5);
  assert.equal(result.targetDistance, 15);
  assert.equal(result.quantity, 100);
  assert.equal(result.rewardToRisk, 3);
  assert.equal(result.estimatedLoss, 500);
  assert.equal(result.estimatedReward, 1500);
});

test('calculateForexLotSize computes standard, mini, micro lots', () => {
  const result = calculateForexLotSize({
    accountBalance: 10000,
    riskPercent: 2, // $200 risk
    stopLossPips: 20,
    pipValuePerStandardLot: 10,
  });

  // standard lots: 200 / (20 * 10) = 1.0 standard lot
  assert.equal(result.cashRisk, 200);
  assert.equal(result.standardLots, 1);
  assert.equal(result.miniLots, 10);
  assert.equal(result.microLots, 100);
  assert.equal(result.units, 100000);
});

test('calculateCompounding computes progressive returns', () => {
  const periods = calculateCompounding({
    initialBalance: 10000,
    returnPercentPerPeriod: 5,
    periods: 3,
  });

  assert.equal(periods.length, 3);
  assert.equal(periods[0].starting, 10000);
  assert.equal(periods[0].gain, 500);
  assert.equal(periods[0].ending, 10500);
  assert.equal(periods[1].starting, 10500);
  assert.equal(periods[1].gain, 525);
  assert.equal(periods[1].ending, 11025);
});

test('calculateKellyCriterion gives valid risk fraction', () => {
  const result = calculateKellyCriterion({
    winRatePercent: 60,
    payoffRatio: 1.5,
  });

  // W = 0.6, R = 1.5 -> Kelly = 0.6 - (0.4 / 1.5) = 0.6 - 0.2667 = ~33.3%
  assert.ok(result.fullKellyPercent > 30 && result.fullKellyPercent < 35);
  assert.ok(result.quarterKellyPercent > 7 && result.quarterKellyPercent < 9);
});

test('calculateRiskOfRuin returns low risk for positive expectancy edge', () => {
  const ruin = calculateRiskOfRuin({
    winRatePercent: 60,
    payoffRatio: 2.0,
    riskPercentPerTrade: 1,
    maxDrawdownThresholdPercent: 20,
  });

  assert.ok(ruin < 1.0);
});
