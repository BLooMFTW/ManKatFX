import React, { useState } from 'react';
import {
  Calculator,
  ShieldAlert,
  TrendingUp,
  Percent,
  Layers,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import {
  calculatePositionSize,
  calculateForexLotSize,
  calculateCompounding,
  calculateKellyCriterion,
  calculateRiskOfRuin,
} from '../../utils/calculations';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export const CalculatorsView: React.FC<{ initialBalance?: number }> = ({
  initialBalance = 25000,
}) => {
  const [activeTab, setActiveTab] = useState<
    'position' | 'lots' | 'rr' | 'compounding' | 'kelly' | 'ruin' | 'dailyLoss'
  >('position');

  // Position Size State
  const [posBalance, setPosBalance] = useState<number>(initialBalance);
  const [posRiskPercent, setPosRiskPercent] = useState<number>(1.0);
  const [posEntry, setPosEntry] = useState<number>(1.085);
  const [posStop, setPosStop] = useState<number>(1.082);
  const [posTarget, setPosTarget] = useState<number>(1.0925);
  const [posMultiplier, setPosMultiplier] = useState<number>(1);

  const posResult = calculatePositionSize({
    accountBalance: Number(posBalance) || 0,
    riskPercent: Number(posRiskPercent) || 0,
    entryPrice: Number(posEntry) || 0,
    stopLossPrice: Number(posStop) || 0,
    targetPrice: Number(posTarget) || undefined,
    contractMultiplier: Number(posMultiplier) || 1,
  });

  // Lot Size State (Forex Pip Calculator)
  const [lotBalance, setLotBalance] = useState<number>(initialBalance);
  const [lotRiskPercent, setLotRiskPercent] = useState<number>(1.5);
  const [stopLossPips, setStopLossPips] = useState<number>(25);
  const [pipValuePerLot, setPipValuePerLot] = useState<number>(10); // Standard $10/pip

  const lotResult = calculateForexLotSize({
    accountBalance: Number(lotBalance) || 0,
    riskPercent: Number(lotRiskPercent) || 0,
    stopLossPips: Number(stopLossPips) || 1,
    pipValuePerStandardLot: Number(pipValuePerLot) || 10,
  });

  // Compounding State
  const [compBalance, setCompBalance] = useState<number>(10000);
  const [compRate, setCompRate] = useState<number>(5.0); // 5% per month
  const [compPeriods, setCompPeriods] = useState<number>(12); // 12 months
  const [compAddition, setCompAddition] = useState<number>(0);

  const compResults = calculateCompounding({
    initialBalance: Number(compBalance) || 0,
    returnPercentPerPeriod: Number(compRate) || 0,
    periods: Number(compPeriods) || 12,
    additionPerPeriod: Number(compAddition) || 0,
  });

  // Kelly Criterion State
  const [kellyWinRate, setKellyWinRate] = useState<number>(55);
  const [kellyPayoff, setKellyPayoff] = useState<number>(2.0);

  const kellyResult = calculateKellyCriterion({
    winRatePercent: Number(kellyWinRate) || 0,
    payoffRatio: Number(kellyPayoff) || 1,
  });

  // Risk of Ruin State
  const [ruinWinRate, setRuinWinRate] = useState<number>(52);
  const [ruinPayoff, setRuinPayoff] = useState<number>(1.8);
  const [ruinRiskPerTrade, setRuinRiskPerTrade] = useState<number>(1.0);
  const [ruinThreshold, setRuinThreshold] = useState<number>(20);

  const ruinResult = calculateRiskOfRuin({
    winRatePercent: Number(ruinWinRate) || 0,
    payoffRatio: Number(ruinPayoff) || 1,
    riskPercentPerTrade: Number(ruinRiskPerTrade) || 1,
    maxDrawdownThresholdPercent: Number(ruinThreshold) || 20,
  });

  // Daily Loss Limit State
  const [dlBalance, setDlBalance] = useState<number>(initialBalance);
  const [dlMaxPercent, setDlMaxPercent] = useState<number>(3.0); // 3% daily limit
  const dlMaxCash = (Number(dlBalance) * Number(dlMaxPercent)) / 100;
  const dlStopTradingLevel = Number(dlBalance) - dlMaxCash;

  const tabs = [
    { id: 'position', label: 'Position Size' },
    { id: 'lots', label: 'Lot Size (Forex)' },
    { id: 'rr', label: 'Risk / Reward' },
    { id: 'compounding', label: 'Compounding' },
    { id: 'kelly', label: 'Kelly Criterion' },
    { id: 'ruin', label: 'Risk of Ruin' },
    { id: 'dailyLoss', label: 'Daily Loss Limit' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-[#121212] border border-[#222]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`text-xs px-3.5 py-2 rounded-xl font-medium transition cursor-pointer ${
              activeTab === t.id
                ? 'bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181818]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Position Size Calculator */}
      {activeTab === 'position' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#131313] border border-[#242424] space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              Institutional Position Sizing
            </h3>
            <p className="text-xs text-zinc-400">
              Calculate exact unit and lot allocation matching your risk tolerance per execution.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Account Balance ($)
                </label>
                <input
                  type="number"
                  value={posBalance}
                  onChange={(e) => setPosBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Risk Tolerance (% of Balance)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={posRiskPercent}
                  onChange={(e) => setPosRiskPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Entry Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={posEntry}
                  onChange={(e) => setPosEntry(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Stop Loss Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={posStop}
                  onChange={(e) => setPosStop(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Target / Take Profit Price (Optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={posTarget}
                  onChange={(e) => setPosTarget(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="p-6 rounded-2xl bg-[#151515] border border-[#282828] flex flex-col justify-between">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-4">
                Allocation Results
              </h4>
              <div className="space-y-4 font-mono">
                <div className="p-3 rounded-xl bg-[#1B1B1B]">
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">
                    Total Cash Risk
                  </span>
                  <span className="text-lg font-bold text-rose-400">
                    {formatCurrency(posResult.cashRisk)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#1B1B1B]">
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">
                    Position Units
                  </span>
                  <span className="text-lg font-bold text-zinc-100">
                    {posResult.quantity.toLocaleString()} Units
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    (~{posResult.lotSize} Standard Lots)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#1B1B1B]">
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">
                    Planned Reward-to-Risk
                  </span>
                  <span className="text-lg font-bold text-amber-300">
                    1:{posResult.rewardToRisk}R
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    Est. Profit: {formatCurrency(posResult.estimatedReward)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 text-[11px] text-zinc-500 border-t border-[#222]">
              Assumes 1:1 currency quote. In exotic cross-pairs, conversion rates apply.
            </div>
          </div>
        </div>
      )}

      {/* 2. Forex Lot Size Calculator */}
      {activeTab === 'lots' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#131313] border border-[#242424] space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              Forex Lot Size & Pip Value Calculator
            </h3>
            <p className="text-xs text-zinc-400">
              Precise lot sizing for FX pairs based on pip stop distance and pip dollar values.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Account Equity ($)
                </label>
                <input
                  type="number"
                  value={lotBalance}
                  onChange={(e) => setLotBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Risk Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={lotRiskPercent}
                  onChange={(e) => setLotRiskPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Stop Loss Distance (Pips)
                </label>
                <input
                  type="number"
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Pip Value / 1.0 Lot ($)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pipValuePerLot}
                  onChange={(e) => setPipValuePerLot(parseFloat(e.target.value) || 10)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Default $10.00 for EUR/USD, GBP/USD, AUD/USD
                </span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="p-6 rounded-2xl bg-[#151515] border border-[#282828] space-y-4 font-mono">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 font-sans">
              Calculated Lots
            </h4>
            <div className="p-3 rounded-xl bg-[#1B1B1B]">
              <span className="text-zinc-400 block text-[10px] font-sans">Standard Lots (100k)</span>
              <span className="text-2xl font-bold text-amber-300">{lotResult.standardLots} Lots</span>
            </div>
            <div className="p-3 rounded-xl bg-[#1B1B1B]">
              <span className="text-zinc-400 block text-[10px] font-sans">Mini Lots (10k)</span>
              <span className="text-lg font-bold text-zinc-200">{lotResult.miniLots} Mini</span>
            </div>
            <div className="p-3 rounded-xl bg-[#1B1B1B]">
              <span className="text-zinc-400 block text-[10px] font-sans">Micro Lots (1k)</span>
              <span className="text-lg font-bold text-zinc-200">{lotResult.microLots} Micro</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Risk / Reward & Break-even Calculator */}
      {activeTab === 'rr' && (
        <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] space-y-4">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Risk / Reward & Break-Even Win Rate Matrix
          </h3>
          <p className="text-xs text-zinc-400">
            Understand the mathematical minimum win rate required to be profitable at various R:R targets.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            {[
              { rr: '1:1', winRate: '50.0%', feeAdj: '53.5%' },
              { rr: '1:1.5', winRate: '40.0%', feeAdj: '43.2%' },
              { rr: '1:2', winRate: '33.3%', feeAdj: '36.1%' },
              { rr: '1:2.5', winRate: '28.6%', feeAdj: '31.2%' },
              { rr: '1:3', winRate: '25.0%', feeAdj: '27.4%' },
              { rr: '1:4', winRate: '20.0%', feeAdj: '22.1%' },
              { rr: '1:5', winRate: '16.7%', feeAdj: '18.5%' },
              { rr: '1:10', winRate: '9.1%', feeAdj: '10.5%' },
            ].map((item) => (
              <div
                key={item.rr}
                className="p-4 rounded-xl bg-[#181818] border border-[#282828] font-mono text-center"
              >
                <span className="text-sm font-bold text-amber-400 block">{item.rr}</span>
                <span className="text-xs text-zinc-200 block mt-1 font-bold">
                  {item.winRate} Break-Even
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  w/ Fees: {item.feeAdj}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Compounding Calculator */}
      {activeTab === 'compounding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Compounding Projection
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Starting Capital ($)
                </label>
                <input
                  type="number"
                  value={compBalance}
                  onChange={(e) => setCompBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Target Return / Month (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={compRate}
                  onChange={(e) => setCompRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Compounding Months
                </label>
                <input
                  type="number"
                  value={compPeriods}
                  onChange={(e) => setCompPeriods(parseInt(e.target.value) || 12)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#151515] border border-[#282828] overflow-hidden">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-3">
              Projected Monthly Balances
            </h4>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#242424] text-zinc-400 uppercase text-[10px]">
                    <th className="py-2">Month</th>
                    <th className="py-2">Starting</th>
                    <th className="py-2">Monthly Gain</th>
                    <th className="py-2 text-right">Ending Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                  {compResults.map((r) => (
                    <tr key={r.period} className="hover:bg-[#1A1A1A]">
                      <td className="py-2 text-zinc-400">M{r.period}</td>
                      <td className="py-2 text-zinc-300">{formatCurrency(r.starting)}</td>
                      <td className="py-2 text-emerald-400">+{formatCurrency(r.gain)}</td>
                      <td className="py-2 text-right font-bold text-zinc-100">
                        {formatCurrency(r.ending)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Kelly Criterion Calculator */}
      {activeTab === 'kelly' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              Kelly Criterion Risk Model
            </h3>
            <p className="text-xs text-zinc-400">
              Calculates mathematically optimal capital percentage to maximize geometric growth.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Historical Win Rate (%)
                </label>
                <input
                  type="number"
                  value={kellyWinRate}
                  onChange={(e) => setKellyWinRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Payoff Ratio (Avg W/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={kellyPayoff}
                  onChange={(e) => setKellyPayoff(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <span className="font-bold block">Institutional Warning:</span>
              <span>{kellyResult.recommendation}</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#151515] border border-[#282828] space-y-4 font-mono">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 font-sans">
              Kelly Fraction Breakdown
            </h4>
            <div className="p-3.5 rounded-xl bg-[#1B1B1B]">
              <span className="text-zinc-400 block text-[10px] font-sans">Full Kelly (Extreme Volatility)</span>
              <span className="text-xl font-bold text-rose-400">{kellyResult.fullKellyPercent}%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#1B1B1B]">
              <span className="text-zinc-400 block text-[10px] font-sans">Half Kelly (High Growth)</span>
              <span className="text-xl font-bold text-amber-300">{kellyResult.halfKellyPercent}%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#1B1B1B] border border-emerald-500/30">
              <span className="text-emerald-400 block text-[10px] font-sans font-bold">
                Quarter Kelly (Recommended Professional Sizing)
              </span>
              <span className="text-2xl font-bold text-emerald-400">
                {kellyResult.quarterKellyPercent}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Risk of Ruin Estimator */}
      {activeTab === 'ruin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Risk of Ruin Probability Estimator
            </h3>
            <p className="text-xs text-zinc-400">
              Estimate the mathematical likelihood of hitting a catastrophic drawdown threshold.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Win Rate (%)</label>
                <input
                  type="number"
                  value={ruinWinRate}
                  onChange={(e) => setRuinWinRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Payoff Ratio</label>
                <input
                  type="number"
                  step="0.1"
                  value={ruinPayoff}
                  onChange={(e) => setRuinPayoff(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Risk / Trade (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ruinRiskPerTrade}
                  onChange={(e) => setRuinRiskPerTrade(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Ruin Threshold (% DD)
                </label>
                <input
                  type="number"
                  value={ruinThreshold}
                  onChange={(e) => setRuinThreshold(parseFloat(e.target.value) || 20)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#151515] border border-[#282828] flex flex-col justify-between font-mono">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 font-sans mb-3">
                Statistical Ruin Probability
              </h4>
              <div className="p-4 rounded-xl bg-[#1C1C1C]">
                <span className="text-xs font-sans text-zinc-400 block">Probability of Reaching -{ruinThreshold}%</span>
                <span
                  className={`text-3xl font-extrabold mt-1 block ${
                    ruinResult < 5
                      ? 'text-emerald-400'
                      : ruinResult < 25
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {ruinResult}%
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 mt-4 font-sans">
              Traders risking under 1% per execution with an edge &gt; 50% and 1.5R enjoy a near 0% risk of ruin.
            </p>
          </div>
        </div>
      )}

      {/* 7. Daily Loss Limit Calculator */}
      {activeTab === 'dailyLoss' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Daily Loss Limit Circuit Breaker
            </h3>
            <p className="text-xs text-zinc-400">
              Establish a non-negotiable intraday maximum loss threshold to protect against tilt and black swan market moves.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Starting Balance ($)
                </label>
                <input
                  type="number"
                  value={dlBalance}
                  onChange={(e) => setDlBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Max Daily Loss (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={dlMaxPercent}
                  onChange={(e) => setDlMaxPercent(parseFloat(e.target.value) || 3)}
                  className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#151515] border border-[#282828] font-mono space-y-4">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 font-sans">
              Intraday Circuit Breaker Thresholds
            </h4>
            <div className="p-3.5 rounded-xl bg-[#1C1C1C]">
              <span className="text-zinc-400 block text-[10px] font-sans">Max Dollar Loss / Day</span>
              <span className="text-xl font-bold text-rose-400">
                -{formatCurrency(dlMaxCash)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#1C1C1C]">
              <span className="text-zinc-400 block text-[10px] font-sans">Hard Stop-Trading Level</span>
              <span className="text-xl font-bold text-zinc-100">
                {formatCurrency(dlStopTradingLevel)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
