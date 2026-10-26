import { Trade, PerformanceStats } from '../types/trade';

/**
 * Calculates Gross PnL, Net PnL, Planned R:R and Realized R:R for an individual trade.
 */
export function calculateTradeFinancials(params: {
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number;
  contractMultiplier?: number;
  commission?: number;
  swap?: number;
}): {
  grossPnL: number;
  netPnL: number;
  plannedRR: number;
  realizedRR: number;
} {
  const {
    direction,
    entryPrice,
    exitPrice,
    stopLoss,
    takeProfit,
    quantity,
    contractMultiplier = 1,
    commission = 0,
    swap = 0,
  } = params;

  let grossPnL = 0;
  let realizedRR = 0;

  const mult = contractMultiplier > 0 ? contractMultiplier : 1;
  const isExitAvailable = exitPrice !== undefined && exitPrice !== null && !isNaN(exitPrice);

  if (isExitAvailable) {
    if (direction === 'LONG') {
      grossPnL = (exitPrice - entryPrice) * quantity * mult;
    } else {
      grossPnL = (entryPrice - exitPrice) * quantity * mult;
    }
  }

  const netPnL = grossPnL - (commission || 0) - (swap || 0);

  // Planned R:R calculation
  let plannedRR = 0;
  if (stopLoss !== undefined && stopLoss !== null && stopLoss > 0) {
    const riskDist = Math.abs(entryPrice - stopLoss);
    if (takeProfit !== undefined && takeProfit !== null && takeProfit > 0 && riskDist > 0) {
      const rewardDist = Math.abs(takeProfit - entryPrice);
      plannedRR = Number((rewardDist / riskDist).toFixed(2));
    }

    // Realized R:R based on stop distance in price terms
    if (isExitAvailable && riskDist > 0) {
      const priceGain = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
      realizedRR = Number((priceGain / riskDist).toFixed(2));
    }
  }

  return {
    grossPnL: Number(grossPnL.toFixed(2)),
    netPnL: Number(netPnL.toFixed(2)),
    plannedRR,
    realizedRR,
  };
}

/**
 * Calculates comprehensive portfolio performance stats from a list of trades and starting balance.
 */
export function calculatePerformanceStats(
  trades: Trade[],
  startingBalance: number = 10000
): PerformanceStats {
  const closedTrades = trades
    .filter((t) => t.status === 'CLOSED')
    .sort((a, b) => new Date(`${a.entryDate} ${a.entryTime || '00:00'}`).getTime() - new Date(`${b.entryDate} ${b.entryTime || '00:00'}`).getTime());

  const openTrades = trades.filter((t) => t.status === 'OPEN');

  const totalTrades = trades.length;
  const closedCount = closedTrades.length;

  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let totalRR = 0;
  let countWithRR = 0;
  let longCount = 0;
  let longWins = 0;
  let shortCount = 0;
  let shortWins = 0;
  let ruleFollowScoresSum = 0;
  let ruleFollowScoresCount = 0;

  // Streaks
  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  // Equity & Drawdown tracking
  let runningEquity = startingBalance;
  let peakEquity = startingBalance;
  let maxDrawdownCash = 0;
  let maxDrawdownPercent = 0;

  for (const trade of closedTrades) {
    const pnl = trade.netPnL;
    runningEquity += pnl;

    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }

    const ddCash = peakEquity - runningEquity;
    if (ddCash > maxDrawdownCash) {
      maxDrawdownCash = ddCash;
    }

    const ddPercent = peakEquity > 0 ? (ddCash / peakEquity) * 100 : 0;
    if (ddPercent > maxDrawdownPercent) {
      maxDrawdownPercent = ddPercent;
    }

    if (pnl > 0.001) {
      grossProfit += pnl;
      winningTrades++;
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;

      if (trade.direction === 'LONG') longWins++;
      else shortWins++;
    } else if (pnl < -0.001) {
      grossLoss += Math.abs(pnl);
      losingTrades++;
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    } else {
      breakevenTrades++;
      currentWinStreak = 0;
      currentLossStreak = 0;
    }

    if (trade.direction === 'LONG') longCount++;
    else shortCount++;

    if (trade.realizedRR !== undefined && trade.realizedRR !== null && trade.realizedRR !== 0) {
      totalRR += trade.realizedRR;
      countWithRR++;
    }

    if (trade.ruleFollowingScore !== undefined && trade.ruleFollowingScore !== null) {
      ruleFollowScoresSum += trade.ruleFollowingScore;
      ruleFollowScoresCount++;
    }
  }

  const totalNetPnL = Number((grossProfit - grossLoss).toFixed(2));
  const currentBalance = Number((startingBalance + totalNetPnL).toFixed(2));
  const currentEquity = currentBalance; // When no open positions or manual balance
  const returnPercent = startingBalance > 0 ? Number(((totalNetPnL / startingBalance) * 100).toFixed(2)) : 0;

  const winRate = closedCount > 0 ? Number(((winningTrades / closedCount) * 100).toFixed(1)) : 0;
  const lossRate = closedCount > 0 ? Number(((losingTrades / closedCount) * 100).toFixed(1)) : 0;

  const profitFactor =
    grossLoss === 0
      ? grossProfit > 0
        ? Number(grossProfit.toFixed(2))
        : 1
      : Number((grossProfit / grossLoss).toFixed(2));

  const averageWin = winningTrades > 0 ? Number((grossProfit / winningTrades).toFixed(2)) : 0;
  const averageLoss = losingTrades > 0 ? Number((grossLoss / losingTrades).toFixed(2)) : 0;

  const averageRR = countWithRR > 0 ? Number((totalRR / countWithRR).toFixed(2)) : 0;

  const payoffRatio = averageLoss > 0 ? Number((averageWin / averageLoss).toFixed(2)) : averageWin > 0 ? 99 : 0;

  // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss) in currency
  const expectancy =
    closedCount > 0
      ? Number(((winRate / 100) * averageWin - (lossRate / 100) * averageLoss).toFixed(2))
      : 0;

  const recoveryFactor =
    maxDrawdownCash > 0
      ? Number((totalNetPnL / maxDrawdownCash).toFixed(2))
      : totalNetPnL > 0
      ? 99
      : 0;

  const longWinRate = longCount > 0 ? Number(((longWins / longCount) * 100).toFixed(1)) : 0;
  const shortWinRate = shortCount > 0 ? Number(((shortWins / shortCount) * 100).toFixed(1)) : 0;

  const ruleFollowingRate =
    ruleFollowScoresCount > 0
      ? Number(((ruleFollowScoresSum / (ruleFollowScoresCount * 5)) * 100).toFixed(1))
      : 100;

  return {
    startingBalance,
    currentBalance,
    currentEquity,
    totalNetPnL,
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    returnPercent,
    totalTrades,
    openTrades: openTrades.length,
    closedTrades: closedCount,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate,
    profitFactor,
    averageWin,
    averageLoss,
    averageRR,
    expectancy,
    payoffRatio,
    maxDrawdownCash: Number(maxDrawdownCash.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    recoveryFactor,
    winStreak: maxWinStreak,
    lossStreak: maxLossStreak,
    longWinRate,
    shortWinRate,
    longCount,
    shortCount,
    avgHoldingTimeMinutes: 180, // default or calculated
    ruleFollowingRate,
  };
}

/**
 * Computes equity curve series for chart visualization.
 */
export function calculateEquityCurve(
  trades: Trade[],
  startingBalance: number = 10000
): Array<{
  date: string;
  equity: number;
  pnl: number;
  cumulativePnL: number;
  drawdownPercent: number;
  tradeNumber: number;
}> {
  const closed = trades
    .filter((t) => t.status === 'CLOSED')
    .sort((a, b) => new Date(`${a.entryDate} ${a.entryTime || '00:00'}`).getTime() - new Date(`${b.entryDate} ${b.entryTime || '00:00'}`).getTime());

  let equity = startingBalance;
  let cumulativePnL = 0;
  let peak = startingBalance;

  const points = [
    {
      date: 'Start',
      equity: startingBalance,
      pnl: 0,
      cumulativePnL: 0,
      drawdownPercent: 0,
      tradeNumber: 0,
    },
  ];

  closed.forEach((trade, index) => {
    cumulativePnL += trade.netPnL;
    equity = startingBalance + cumulativePnL;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;

    points.push({
      date: trade.exitDate || trade.entryDate,
      equity: Number(equity.toFixed(2)),
      pnl: trade.netPnL,
      cumulativePnL: Number(cumulativePnL.toFixed(2)),
      drawdownPercent: Number(dd.toFixed(2)),
      tradeNumber: index + 1,
    });
  });

  return points;
}

/**
 * Position sizing calculator
 */
export function calculatePositionSize(params: {
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
  targetPrice?: number;
  contractMultiplier?: number;
}): {
  cashRisk: number;
  stopDistance: number;
  targetDistance: number;
  quantity: number;
  lotSize: number;
  estimatedLoss: number;
  estimatedReward: number;
  rewardToRisk: number;
} {
  const {
    accountBalance,
    riskPercent,
    entryPrice,
    stopLossPrice,
    targetPrice,
    contractMultiplier = 1,
  } = params;

  const cashRisk = (accountBalance * (riskPercent / 100));
  const stopDistance = Math.abs(entryPrice - stopLossPrice);
  const mult = contractMultiplier > 0 ? contractMultiplier : 1;

  let quantity = 0;
  let estimatedLoss = 0;
  let lotSize = 0;

  if (stopDistance > 0) {
    quantity = cashRisk / (stopDistance * mult);
    lotSize = quantity / 100000; // Standard forex lot units
    estimatedLoss = quantity * stopDistance * mult;
  }

  let targetDistance = 0;
  let estimatedReward = 0;
  let rewardToRisk = 0;

  if (targetPrice !== undefined && targetPrice > 0) {
    targetDistance = Math.abs(targetPrice - entryPrice);
    estimatedReward = quantity * targetDistance * mult;
    if (stopDistance > 0) {
      rewardToRisk = targetDistance / stopDistance;
    }
  }

  return {
    cashRisk: Number(cashRisk.toFixed(2)),
    stopDistance: Number(stopDistance.toFixed(5)),
    targetDistance: Number(targetDistance.toFixed(5)),
    quantity: Number(quantity.toFixed(4)),
    lotSize: Number(lotSize.toFixed(2)),
    estimatedLoss: Number(estimatedLoss.toFixed(2)),
    estimatedReward: Number(estimatedReward.toFixed(2)),
    rewardToRisk: Number(rewardToRisk.toFixed(2)),
  };
}

/**
 * Forex Lot Size Calculator with Pip specifications
 */
export function calculateForexLotSize(params: {
  accountBalance: number;
  riskPercent: number;
  stopLossPips: number;
  pipValuePerStandardLot?: number; // usually $10 for USD quote
}): {
  cashRisk: number;
  standardLots: number;
  miniLots: number;
  microLots: number;
  units: number;
} {
  const {
    accountBalance,
    riskPercent,
    stopLossPips,
    pipValuePerStandardLot = 10,
  } = params;

  const cashRisk = accountBalance * (riskPercent / 100);

  if (stopLossPips <= 0 || pipValuePerStandardLot <= 0) {
    return { cashRisk, standardLots: 0, miniLots: 0, microLots: 0, units: 0 };
  }

  const standardLots = cashRisk / (stopLossPips * pipValuePerStandardLot);
  const units = standardLots * 100000;

  return {
    cashRisk: Number(cashRisk.toFixed(2)),
    standardLots: Number(standardLots.toFixed(2)),
    miniLots: Number((standardLots * 10).toFixed(2)),
    microLots: Number((standardLots * 100).toFixed(2)),
    units: Math.round(units),
  };
}

/**
 * Compounding Interest / Future Account Balance Calculator
 */
export function calculateCompounding(params: {
  initialBalance: number;
  returnPercentPerPeriod: number;
  periods: number;
  additionPerPeriod?: number;
}): Array<{ period: number; starting: number; gain: number; ending: number }> {
  const { initialBalance, returnPercentPerPeriod, periods, additionPerPeriod = 0 } = params;
  const results = [];
  let current = initialBalance;

  for (let i = 1; i <= periods; i++) {
    const start = current;
    const gain = start * (returnPercentPerPeriod / 100);
    const end = start + gain + additionPerPeriod;
    results.push({
      period: i,
      starting: Number(start.toFixed(2)),
      gain: Number(gain.toFixed(2)),
      ending: Number(end.toFixed(2)),
    });
    current = end;
  }

  return results;
}

/**
 * Kelly Criterion Calculator
 */
export function calculateKellyCriterion(params: {
  winRatePercent: number;
  payoffRatio: number;
}): {
  fullKellyPercent: number;
  halfKellyPercent: number;
  quarterKellyPercent: number;
  recommendation: string;
} {
  const { winRatePercent, payoffRatio } = params;
  const W = winRatePercent / 100;
  const R = payoffRatio;

  if (R <= 0 || W <= 0) {
    return {
      fullKellyPercent: 0,
      halfKellyPercent: 0,
      quarterKellyPercent: 0,
      recommendation: 'Insufficient edge or negative risk/reward ratio.',
    };
  }

  // Kelly % = W - ((1 - W) / R)
  const full = (W - (1 - W) / R) * 100;
  const boundedFull = Math.max(0, Math.min(100, full));
  const half = boundedFull / 2;
  const quarter = boundedFull / 4;

  let recommendation = 'Positive statistical expectancy.';
  if (full <= 0) {
    recommendation = 'Negative expectancy. Zero risk recommended.';
  } else if (full > 25) {
    recommendation = 'Aggressive Kelly sizing. Recommended to use Quarter-Kelly (max 2-5%) to avoid ruin.';
  }

  return {
    fullKellyPercent: Number(boundedFull.toFixed(2)),
    halfKellyPercent: Number(half.toFixed(2)),
    quarterKellyPercent: Number(quarter.toFixed(2)),
    recommendation,
  };
}

/**
 * Risk of Ruin Estimator
 */
export function calculateRiskOfRuin(params: {
  winRatePercent: number;
  payoffRatio: number;
  riskPercentPerTrade: number;
  maxDrawdownThresholdPercent: number;
}): number {
  const { winRatePercent, payoffRatio, riskPercentPerTrade, maxDrawdownThresholdPercent } = params;
  const W = winRatePercent / 100;
  const L = 1 - W;
  const R = payoffRatio;

  if (riskPercentPerTrade <= 0 || maxDrawdownThresholdPercent <= 0) return 0;
  const unitsOfCapital = maxDrawdownThresholdPercent / riskPercentPerTrade;

  // Expected edge per dollar risked
  const expectedValue = W * R - L;
  if (expectedValue <= 0) return 100; // Certain ruin with negative edge

  // Formula approximation: ((1 - EV) / (1 + EV)) ^ Units
  const base = Math.max(0, (1 - expectedValue * 0.5) / (1 + expectedValue * 0.5));
  const ruinProb = Math.min(1, Math.pow(base, unitsOfCapital)) * 100;
  return Number(ruinProb.toFixed(2));
}
