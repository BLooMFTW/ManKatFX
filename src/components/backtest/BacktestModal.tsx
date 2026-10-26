import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { BacktestTrade, TradeDirection, MarketSession } from '../../types/trade';
import { POPULAR_INSTRUMENTS } from '../../lib/market/marketService';
import { ArrowUpRight, ArrowDownRight, Sparkles, AlertCircle } from 'lucide-react';

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: BacktestTrade) => Promise<void>;
  userId: string;
}

const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '2H', '4H', 'Daily', 'Weekly'];

export const BacktestModal: React.FC<BacktestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userId,
}) => {
  const [pair, setPair] = useState('EURUSD');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [timeframe, setTimeframe] = useState('15m');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryPrice, setEntryPrice] = useState<number>(1.085);
  const [exitPrice, setExitPrice] = useState<number>(1.091);
  const [stopLoss, setStopLoss] = useState<number>(1.082);
  const [takeProfit, setTakeProfit] = useState<number>(1.094);
  const [plannedRR, setPlannedRR] = useState<number>(3.0);
  const [realizedRR, setRealizedRR] = useState<number>(2.0);
  const [outcome, setOutcome] = useState<'WIN' | 'LOSS' | 'BE'>('WIN');
  const [strategy, setStrategy] = useState('ICT Silver Bullet / FVG');
  const [setupType, setSetupType] = useState('London Session Sweep & Retest');
  const [session, setSession] = useState<MarketSession>('LONDON');
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate R:R when prices change
  useEffect(() => {
    const entry = Number(entryPrice);
    const sl = Number(stopLoss);
    const exit = Number(exitPrice);
    const tp = Number(takeProfit);

    if (entry > 0 && sl > 0) {
      const riskDist = Math.abs(entry - sl);
      if (riskDist > 0) {
        if (tp > 0) {
          const rewardDist = Math.abs(tp - entry);
          setPlannedRR(Number((rewardDist / riskDist).toFixed(2)));
        }

        if (exit > 0) {
          let outcomeR = 0;
          if (direction === 'LONG') {
            outcomeR = (exit - entry) / riskDist;
          } else {
            outcomeR = (entry - exit) / riskDist;
          }
          const roundedR = Number(outcomeR.toFixed(2));
          setRealizedRR(roundedR);

          if (roundedR > 0.1) setOutcome('WIN');
          else if (roundedR < -0.1) setOutcome('LOSS');
          else setOutcome('BE');
        }
      }
    }
  }, [entryPrice, exitPrice, stopLoss, takeProfit, direction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pair.trim()) {
      setError('Please specify a valid pair / asset symbol.');
      return;
    }
    if (!entryPrice || entryPrice <= 0) {
      setError('Entry price must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const backtestTrade: BacktestTrade = {
        id: `bt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: userId || 'demo',
        pair: pair.toUpperCase().trim(),
        direction,
        timeframe,
        entryDate,
        entryPrice: Number(entryPrice),
        exitPrice: Number(exitPrice),
        stopLoss: Number(stopLoss),
        takeProfit: Number(takeProfit),
        plannedRR: Number(plannedRR),
        realizedRR: Number(realizedRR),
        outcome,
        pnlR: Number(realizedRR),
        strategy,
        setupType,
        session,
        notes,
        screenshotUrl,
        createdAt: new Date().toISOString(),
      };

      await onSave(backtestTrade);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save backtest trade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Backtest Trade"
      subtitle="Record historical execution with automated R:R calculation and performance tracking."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Pair Selector */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Pair / Instrument
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSDT', 'NAS100', 'US30'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPair(p)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition cursor-pointer ${
                  pair === p
                    ? 'bg-[#D4AF37] text-black shadow'
                    : 'bg-[#181818] border border-[#262626] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={pair}
            onChange={(e) => setPair(e.target.value.toUpperCase())}
            placeholder="e.g. EURUSD, XAUUSD, BTCUSDT"
            className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 font-mono text-xs rounded-xl px-3.5 py-2.5 focus:border-[#D4AF37] focus:outline-none"
            required
          />
        </div>

        {/* Direction & Timeframe */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Direction
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#161616] rounded-xl border border-[#242424]">
              <button
                type="button"
                onClick={() => setDirection('LONG')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition cursor-pointer ${
                  direction === 'LONG'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>LONG</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection('SHORT')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition cursor-pointer ${
                  direction === 'SHORT'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>SHORT</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Execution Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Session */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Historical Entry Date
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Market Session
            </label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value as MarketSession)}
              className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="LONDON">London (08:00 - 16:30 UTC)</option>
              <option value="NEW_YORK">New York (13:00 - 21:00 UTC)</option>
              <option value="OVERLAP">London / NY Overlap</option>
              <option value="ASIA">Asia / Tokyo</option>
            </select>
          </div>
        </div>

        {/* Price Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#141414] border border-[#242424]">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Entry Price
            </label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#1B1B1B] border border-[#2D2D2D] text-zinc-100 font-mono text-xs rounded-lg px-2.5 py-2 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Exit Price
            </label>
            <input
              type="number"
              step="any"
              value={exitPrice}
              onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#1B1B1B] border border-[#2D2D2D] text-zinc-100 font-mono text-xs rounded-lg px-2.5 py-2 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Stop Loss
            </label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#1B1B1B] border border-[#2D2D2D] text-rose-300 font-mono text-xs rounded-lg px-2.5 py-2 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Take Profit
            </label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#1B1B1B] border border-[#2D2D2D] text-emerald-300 font-mono text-xs rounded-lg px-2.5 py-2 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Calculated R & Outcome Result */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#161616] border border-[#262626]">
          <div>
            <span className="block text-[10px] uppercase font-semibold text-zinc-400">Planned R:R</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{plannedRR}R</span>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-semibold text-zinc-400">Realized R</span>
            <input
              type="number"
              step="0.05"
              value={realizedRR}
              onChange={(e) => setRealizedRR(parseFloat(e.target.value) || 0)}
              className="w-24 bg-[#1F1F1F] border border-[#333] text-zinc-100 font-mono font-bold text-xs rounded-lg px-2 py-1 mt-0.5 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <span className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">Outcome</span>
            <div className="flex gap-1">
              {(['WIN', 'LOSS', 'BE'] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    outcome === o
                      ? o === 'WIN'
                        ? 'bg-emerald-600 text-white'
                        : o === 'LOSS'
                        ? 'bg-rose-600 text-white'
                        : 'bg-zinc-600 text-white'
                      : 'bg-[#222] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Strategy & Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Strategy / Setup Model
            </label>
            <input
              type="text"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="e.g. Liquidity Sweep, Order Block"
              className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              TradingView / Screenshot URL
            </label>
            <input
              type="url"
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              placeholder="https://www.tradingview.com/x/..."
              className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Backtest Notes & Key Observations
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="HTF bias confirmation, entry trigger candle, liquidity sweeps, invalidation notes..."
            className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-xs rounded-xl p-3 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#222]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B] text-zinc-300 hover:text-zinc-100 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold shadow-md hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Recording...' : 'Log Backtest Trade'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
