import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import {
  Trade,
  TradingAccount,
  TradingStrategy,
  TradeDirection,
  TradeStatus,
  AssetClass,
  MarketSession,
} from '../../types/trade';
import { calculateTradeFinancials } from '../../utils/calculations';
import { formatCurrency, formatRR } from '../../utils/formatters';
import { POPULAR_INSTRUMENTS } from '../../lib/market/marketService';

interface TradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => Promise<void>;
  editingTrade?: Trade | null;
  accounts: TradingAccount[];
  strategies: TradingStrategy[];
  activeAccountId: string;
}

export const TradeEntryModal: React.FC<TradeEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTrade,
  accounts,
  strategies,
  activeAccountId,
}) => {
  const [symbol, setSymbol] = useState('EURUSD');
  const [assetClass, setAssetClass] = useState<AssetClass>('FOREX');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [status, setStatus] = useState<TradeStatus>('CLOSED');
  const [accountId, setAccountId] = useState(activeAccountId || accounts[0]?.id || '');

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState('09:30');
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitTime, setExitTime] = useState('11:00');
  const [session, setSession] = useState<MarketSession>('LONDON');

  const [entryPrice, setEntryPrice] = useState<number>(1.085);
  const [exitPrice, setExitPrice] = useState<number | undefined>(1.089);
  const [stopLoss, setStopLoss] = useState<number | undefined>(1.082);
  const [takeProfit, setTakeProfit] = useState<number | undefined>(1.092);

  const [quantity, setQuantity] = useState<number>(100000);
  const [lotSize, setLotSize] = useState<number>(1.0);
  const [contractMultiplier, setContractMultiplier] = useState<number>(1);
  const [riskPercentage, setRiskPercentage] = useState<number>(1.0);
  const [commission, setCommission] = useState<number>(7.0);
  const [swap, setSwap] = useState<number>(0);

  const [strategy, setStrategy] = useState('');
  const [setupType, setSetupType] = useState('Breakout Retest');
  const [entryReason, setEntryReason] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [emotionBefore, setEmotionBefore] = useState<'CONFIDENT' | 'CALM' | 'FOMO' | 'HESITANT' | 'REVENGE'>('CALM');
  const [emotionAfter, setEmotionAfter] = useState<'SATISFIED' | 'DISCIPLINED' | 'GREEDY' | 'FRUSTRATED' | 'RELIEVED'>('DISCIPLINED');
  const [ruleFollowingScore, setRuleFollowingScore] = useState<number>(5);
  const [mistakes, setMistakes] = useState('');
  const [lessons, setLessons] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset when editingTrade changes
  useEffect(() => {
    if (editingTrade) {
      setSymbol(editingTrade.symbol);
      setAssetClass(editingTrade.assetClass);
      setDirection(editingTrade.direction);
      setStatus(editingTrade.status);
      setAccountId(editingTrade.accountId);
      setEntryDate(editingTrade.entryDate);
      setEntryTime(editingTrade.entryTime || '09:00');
      setExitDate(editingTrade.exitDate || editingTrade.entryDate);
      setExitTime(editingTrade.exitTime || '11:00');
      setSession(editingTrade.session || 'LONDON');
      setEntryPrice(editingTrade.entryPrice);
      setExitPrice(editingTrade.exitPrice);
      setStopLoss(editingTrade.stopLoss);
      setTakeProfit(editingTrade.takeProfit);
      setQuantity(editingTrade.quantity);
      setLotSize(editingTrade.lotSize || 1.0);
      setContractMultiplier(editingTrade.contractMultiplier || 1);
      setRiskPercentage(editingTrade.riskPercentage || 1.0);
      setCommission(editingTrade.commission || 0);
      setSwap(editingTrade.swap || 0);
      setStrategy(editingTrade.strategy || '');
      setSetupType(editingTrade.setupType || '');
      setEntryReason(editingTrade.entryReason || '');
      setExitReason(editingTrade.exitReason || '');
      setEmotionBefore(editingTrade.emotionBefore || 'CALM');
      setEmotionAfter(editingTrade.emotionAfter || 'DISCIPLINED');
      setRuleFollowingScore(editingTrade.ruleFollowingScore || 5);
      setMistakes(editingTrade.mistakes || '');
      setLessons(editingTrade.lessons || '');
      setTagsInput(editingTrade.tags ? editingTrade.tags.join(', ') : '');
      setNotes(editingTrade.notes || '');
      setScreenshotUrl(editingTrade.screenshotUrl || '');
    } else {
      // Default reset
      setAccountId(activeAccountId || accounts[0]?.id || '');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setStatus('CLOSED');
      setError(null);
    }
  }, [editingTrade, isOpen, activeAccountId, accounts]);

  // Real-time calculation of financials
  const calculated = calculateTradeFinancials({
    direction,
    entryPrice: Number(entryPrice) || 0,
    exitPrice: status === 'CLOSED' ? Number(exitPrice) || undefined : undefined,
    stopLoss: Number(stopLoss) || undefined,
    takeProfit: Number(takeProfit) || undefined,
    quantity: Number(quantity) || 1,
    contractMultiplier: Number(contractMultiplier) || 1,
    commission: Number(commission) || 0,
    swap: Number(swap) || 0,
  });

  const handleSymbolSelect = (sym: string) => {
    setSymbol(sym);
    const spec = POPULAR_INSTRUMENTS.find((i) => i.symbol === sym);
    if (spec) {
      setAssetClass(spec.category);
      if (spec.category === 'FOREX') {
        setQuantity(100000);
        setLotSize(1.0);
      } else if (spec.category === 'CRYPTO') {
        setQuantity(1.0);
        setLotSize(1.0);
      } else if (spec.category === 'METALS') {
        setQuantity(100);
        setLotSize(1.0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!symbol.trim()) {
      setError('Please provide a valid trading instrument symbol.');
      return;
    }
    if (!entryPrice || entryPrice <= 0) {
      setError('Entry price must be greater than zero.');
      return;
    }
    if (status === 'CLOSED' && (!exitPrice || exitPrice <= 0)) {
      setError('Closed trade requires a valid exit price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const tradeData: Trade = {
        id: editingTrade?.id || `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: editingTrade?.userId || '',
        accountId: accountId || accounts[0]?.id || 'acc_default',
        symbol: symbol.toUpperCase().trim(),
        assetClass,
        direction,
        status,
        entryDate,
        entryTime,
        exitDate: status === 'CLOSED' ? exitDate : undefined,
        exitTime: status === 'CLOSED' ? exitTime : undefined,
        session,
        entryPrice: Number(entryPrice),
        exitPrice: status === 'CLOSED' ? Number(exitPrice) : undefined,
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        takeProfit: takeProfit ? Number(takeProfit) : undefined,
        quantity: Number(quantity),
        lotSize: Number(lotSize),
        contractMultiplier: Number(contractMultiplier) || 1,
        riskPercentage: Number(riskPercentage) || 1,
        commission: Number(commission) || 0,
        swap: Number(swap) || 0,
        grossPnL: calculated.grossPnL,
        netPnL: calculated.netPnL,
        plannedRR: calculated.plannedRR,
        realizedRR: calculated.realizedRR,
        strategy: strategy || strategies[0]?.name || 'Discretionary',
        setupType,
        entryReason,
        exitReason,
        emotionBefore,
        emotionAfter,
        ruleFollowingScore,
        mistakes,
        lessons,
        tags,
        screenshotUrl,
        notes,
        createdAt: editingTrade?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(tradeData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTrade ? `Edit Trade: ${editingTrade.symbol}` : 'Log New Trade Execution'}
      subtitle="Complete institutional trade record with automatic risk, P&L, and R:R calculations."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Live Calculation Preview Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Net P&L</span>
            <span
              className={`font-mono text-base font-bold ${
                calculated.netPnL > 0
                  ? 'text-emerald-400'
                  : calculated.netPnL < 0
                  ? 'text-rose-400'
                  : 'text-zinc-300'
              }`}
            >
              {formatCurrency(calculated.netPnL, 'USD', true)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Gross P&L</span>
            <span className="font-mono text-sm text-zinc-300">
              {formatCurrency(calculated.grossPnL, 'USD', true)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Planned R:R</span>
            <span className="font-mono text-sm text-amber-300 font-semibold">
              {formatRR(calculated.plannedRR)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Realized R:R</span>
            <span
              className={`font-mono text-sm font-semibold ${
                calculated.realizedRR > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {calculated.realizedRR !== 0 ? `${calculated.realizedRR > 0 ? '+' : ''}${calculated.realizedRR}R` : '—'}
            </span>
          </div>
        </div>

        {/* Direction & Status Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Trade Direction</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#161616] border border-[#282828] rounded-xl">
              <button
                type="button"
                onClick={() => setDirection('LONG')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  direction === 'LONG'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                LONG ▲
              </button>
              <button
                type="button"
                onClick={() => setDirection('SHORT')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  direction === 'SHORT'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                SHORT ▼
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Execution Status</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#161616] border border-[#282828] rounded-xl">
              <button
                type="button"
                onClick={() => setStatus('CLOSED')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  status === 'CLOSED'
                    ? 'bg-zinc-200 text-black shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                CLOSED
              </button>
              <button
                type="button"
                onClick={() => setStatus('OPEN')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  status === 'OPEN'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ACTIVE / OPEN
              </button>
            </div>
          </div>
        </div>

        {/* Account & Instrument Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Active Portfolio</label>
            <div className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl px-3 py-2.5 flex items-center justify-between font-mono">
              <span className="font-semibold text-zinc-100 truncate">{accounts[0]?.name || 'Primary Portfolio'}</span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                {accounts[0]?.currency || 'USD'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Symbol / Pair</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="EURUSD, XAUUSD, BTCUSDT"
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Asset Class</label>
            <select
              value={assetClass}
              onChange={(e) => setAssetClass(e.target.value as AssetClass)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="FOREX">Forex</option>
              <option value="CRYPTO">Crypto</option>
              <option value="METALS">Metals</option>
              <option value="INDICES">Indices</option>
              <option value="COMMODITIES">Commodities</option>
              <option value="STOCKS">Equities</option>
            </select>
          </div>
        </div>

        {/* Quick symbol selector chips */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-zinc-400 font-medium mr-1">Quick Select:</span>
          {['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSDT', 'US30'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSymbolSelect(s)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                symbol === s
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#181818] text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Pricing Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#151515] border border-[#242424]">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Entry Price *</label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#1B1B1B] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              {status === 'CLOSED' ? 'Exit Price *' : 'Exit Price (Optional)'}
            </label>
            <input
              type="number"
              step="any"
              value={exitPrice ?? ''}
              onChange={(e) =>
                setExitPrice(e.target.value ? parseFloat(e.target.value) : undefined)
              }
              disabled={status === 'OPEN'}
              className={`w-full bg-[#1B1B1B] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none ${
                status === 'OPEN' ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Stop Loss</label>
            <input
              type="number"
              step="any"
              value={stopLoss ?? ''}
              onChange={(e) =>
                setStopLoss(e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="w-full bg-[#1B1B1B] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Take Profit</label>
            <input
              type="number"
              step="any"
              value={takeProfit ?? ''}
              onChange={(e) =>
                setTakeProfit(e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="w-full bg-[#1B1B1B] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* Position Sizing & Fees */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Position / Units</label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Lot Size</label>
            <input
              type="number"
              step="0.01"
              value={lotSize}
              onChange={(e) => setLotSize(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Commission ($)</label>
            <input
              type="number"
              step="0.01"
              value={commission}
              onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Swap / Funding ($)</label>
            <input
              type="number"
              step="0.01"
              value={swap}
              onChange={(e) => setSwap(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* Dates & Market Session */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Entry Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Entry Time</label>
            <input
              type="time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Market Session</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value as MarketSession)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="LONDON">London (07:00-16:00 UTC)</option>
              <option value="NEW_YORK">New York (13:00-22:00 UTC)</option>
              <option value="ASIA">Asia / Tokyo (00:00-09:00 UTC)</option>
              <option value="OVERLAP">London/NY Overlap</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Exit Date</label>
            <input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              disabled={status === 'OPEN'}
              className={`w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none ${
                status === 'OPEN' ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>

        {/* Strategy & Psychology */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Strategy</label>
            <input
              type="text"
              list="strategy-list"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="e.g. London Breakout"
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
            <datalist id="strategy-list">
              {strategies.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Setup Type</label>
            <input
              type="text"
              value={setupType}
              onChange={(e) => setSetupType(e.target.value)}
              placeholder="e.g. Order Block, Liquidity Sweep"
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-100 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Discipline / Rule Score: {ruleFollowingScore}/5
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={ruleFollowingScore}
              onChange={(e) => setRuleFollowingScore(parseInt(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer mt-2"
            />
          </div>
        </div>

        {/* Psychology: Emotion Before & After */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Mindset / Emotion Before Entry
            </label>
            <select
              value={emotionBefore}
              onChange={(e) => setEmotionBefore(e.target.value as any)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="CALM">Calm & Focused</option>
              <option value="CONFIDENT">Confident / Plan-Ready</option>
              <option value="FOMO">FOMO / Impulsive</option>
              <option value="HESITANT">Hesitant / Fearful</option>
              <option value="REVENGE">Revenge / Over-leveraging</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Mindset / Emotion After Exit
            </label>
            <select
              value={emotionAfter}
              onChange={(e) => setEmotionAfter(e.target.value as any)}
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="DISCIPLINED">Disciplined Execution</option>
              <option value="SATISFIED">Satisfied with Outcome</option>
              <option value="FRUSTRATED">Frustrated / Annoyed</option>
              <option value="GREEDY">Greedy (Left money on table)</option>
              <option value="RELIEVED">Relieved (Narrow escape)</option>
            </select>
          </div>
        </div>

        {/* Reasoning & Journal Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Entry Reason & Thesis</label>
            <textarea
              rows={2}
              value={entryReason}
              onChange={(e) => setEntryReason(e.target.value)}
              placeholder="Why did you enter this setup?"
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl p-2.5 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Exit Reason / Management</label>
            <textarea
              rows={2}
              value={exitReason}
              onChange={(e) => setExitReason(e.target.value)}
              placeholder="Why was the trade closed?"
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl p-2.5 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* Mistakes, Lessons & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Mistakes (if any)</label>
            <input
              type="text"
              value={mistakes}
              onChange={(e) => setMistakes(e.target.value)}
              placeholder="e.g. Sized too large, entered early"
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Key Lessons</label>
            <input
              type="text"
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="e.g. Respect higher timeframe trend"
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Breakout, HighRisk, News"
              className="w-full bg-[#161616] border border-[#2C2C2C] text-zinc-200 text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222222]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] via-[#D4AF37] to-[#B89428] text-[#090909] font-bold text-xs shadow-lg shadow-amber-500/10 hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Recording...' : editingTrade ? 'Update Trade Record' : 'Save & Log Trade'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
