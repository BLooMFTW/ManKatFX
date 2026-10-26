import React, { useState } from 'react';
import { PieChart, Plus, Trash2, Edit2, CheckCircle2, Award } from 'lucide-react';
import { Trade, TradingStrategy } from '../../types/trade';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { Modal } from '../ui/Modal';

interface StrategyViewProps {
  strategies: TradingStrategy[];
  trades: Trade[];
  onSaveStrategy: (strategy: TradingStrategy) => Promise<void>;
  onDeleteStrategy: (id: string) => Promise<void>;
}

export const StrategyView: React.FC<StrategyViewProps> = ({
  strategies,
  trades,
  onSaveStrategy,
  onDeleteStrategy,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrat, setEditingStrat] = useState<TradingStrategy | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [timeframe, setTimeframe] = useState('15m / 1H');
  const [targetRR, setTargetRR] = useState<number>(2.5);

  const openNewModal = () => {
    setEditingStrat(null);
    setName('');
    setDescription('');
    setRules('');
    setTimeframe('15m / 1H');
    setTargetRR(2.5);
    setIsModalOpen(true);
  };

  const openEditModal = (strat: TradingStrategy) => {
    setEditingStrat(strat);
    setName(strat.name);
    setDescription(strat.description);
    setRules(strat.rules);
    setTimeframe(strat.timeframe);
    setTargetRR(strat.targetRR);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: TradingStrategy = {
      id: editingStrat?.id || `strat_${Date.now()}`,
      userId: editingStrat?.userId || '',
      name: name.trim(),
      description,
      rules,
      timeframe,
      targetRR: Number(targetRR) || 2.0,
      createdAt: editingStrat?.createdAt || new Date().toISOString(),
    };

    await onSaveStrategy(data);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-[#222]">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" />
            Strategy Playbook & Edge Performance
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit which specific setups generate alpha versus which leak capital.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold text-xs shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Strategy</span>
        </button>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategies.map((strat) => {
          // Calculate stats for this strategy
          const stratTrades = trades.filter(
            (t) => (t.strategy || '').toLowerCase() === strat.name.toLowerCase()
          );
          const closed = stratTrades.filter((t) => t.status === 'CLOSED');
          const wins = closed.filter((t) => t.netPnL > 0);
          const losses = closed.filter((t) => t.netPnL < 0);
          const totalPnL = closed.reduce((acc, t) => acc + t.netPnL, 0);
          const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;

          const grossWin = wins.reduce((acc, t) => acc + t.netPnL, 0);
          const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnL, 0));
          const pf = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : grossWin > 0 ? 'Max' : '1.0';

          return (
            <div
              key={strat.id}
              className="p-6 rounded-2xl bg-[#131313] border border-[#222] flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-zinc-100">{strat.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {strat.timeframe}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(strat)}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete strategy: ${strat.name}?`)) onDeleteStrategy(strat.id);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-4">{strat.description}</p>

                {/* Performance Snapshot */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#181818] border border-[#262626] font-mono text-center mb-4">
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-sans">Net P&L</span>
                    <span
                      className={`text-xs font-bold ${
                        totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(totalPnL, 'USD', true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-sans">Win Rate</span>
                    <span className="text-xs font-bold text-zinc-200">
                      {winRate.toFixed(0)}% ({closed.length}T)
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-sans">Profit Factor</span>
                    <span className="text-xs font-bold text-amber-300">{pf}</span>
                  </div>
                </div>

                {/* Strategy Rules Checklist */}
                {strat.rules && (
                  <div className="space-y-1.5 text-xs text-zinc-300">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                      Execution Rules & Checklist
                    </span>
                    {strat.rules.split('\n').map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#222] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>Target R:R: 1:{strat.targetRR}R</span>
                <span>Active Model</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategy Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStrat ? `Edit Strategy: ${editingStrat.name}` : 'Create Trading Strategy Setup'}
        subtitle="Define clear systematic entry and risk parameters for this setup."
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Strategy Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fair Value Gap Sweep"
              className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Timeframe</label>
              <input
                type="text"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="e.g. 15m / 1H"
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Minimum Target R:R</label>
              <input
                type="number"
                step="0.1"
                value={targetRR}
                onChange={(e) => setTargetRR(parseFloat(e.target.value) || 2)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Setup Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thesis and market conditions required..."
              className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl p-2.5 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Rules & Checklist (One per line)
            </label>
            <textarea
              rows={4}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="1. Higher timeframe trend alignment&#10;2. Wait for liquidity sweep&#10;3. Minimum 2R target"
              className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl p-2.5 focus:border-[#D4AF37] focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#222]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold text-xs shadow-md cursor-pointer"
            >
              Save Strategy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
