import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Circle, Trash2, Award } from 'lucide-react';
import { TradingGoal } from '../../types/trade';
import { Modal } from '../ui/Modal';

interface GoalsViewProps {
  goals: TradingGoal[];
  onSaveGoal: (goal: TradingGoal) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, onSaveGoal, onDeleteGoal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'RETURN' | 'DRAWDOWN' | 'WIN_RATE' | 'RULES' | 'VOLUME'>('RETURN');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [unit, setUnit] = useState<'%' | '$' | 'trades' | 'score'>('%');
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGoal: TradingGoal = {
      id: `goal_${Date.now()}`,
      userId: '',
      title: title.trim(),
      category,
      targetValue: Number(targetValue),
      currentValue: Number(currentValue),
      unit,
      period,
      completed: currentValue >= targetValue,
      createdAt: new Date().toISOString(),
    };

    await onSaveGoal(newGoal);
    setIsModalOpen(false);
    setTitle('');
  };

  const toggleComplete = async (g: TradingGoal) => {
    await onSaveGoal({ ...g, completed: !g.completed });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-[#222]">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Performance & Risk Control Milestones
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track quantitative discipline, drawdown limits, and monthly process goals.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold text-xs shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Target</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100));
          return (
            <div
              key={goal.id}
              className={`p-5 rounded-2xl border transition shadow-lg flex flex-col justify-between ${
                goal.completed
                  ? 'bg-emerald-950/15 border-emerald-500/30'
                  : 'bg-[#141414] border-[#242424]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleComplete(goal)}
                      className="cursor-pointer text-zinc-400 hover:text-amber-400 transition"
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-600" />
                      )}
                    </button>
                    <div>
                      <span className="text-sm font-bold text-zinc-100 block">{goal.title}</span>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase">
                        {goal.period} • {goal.category}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1 text-zinc-500 hover:text-rose-400 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                    <span className="text-zinc-400 text-[11px]">
                      Current: {goal.currentValue}
                      {goal.unit}
                    </span>
                    <span className="text-amber-400 font-bold">
                      Target: {goal.targetValue}
                      {goal.unit} ({pct.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal.completed
                          ? 'bg-emerald-400'
                          : 'bg-gradient-to-r from-amber-500 to-amber-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#222] flex items-center justify-between text-[10px] text-zinc-500">
                <span>{goal.completed ? 'Goal Achieved' : 'In Progress'}</span>
                <span>Tracked Daily</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Establish Trading Target / Constraint"
        subtitle="Set an objective milestone for process adherence or performance."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Target Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Keep monthly drawdown under 5%"
              className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="RETURN">Monthly Return</option>
                <option value="DRAWDOWN">Max Drawdown Limit</option>
                <option value="RULES">Rule Adherence %</option>
                <option value="WIN_RATE">Win Rate</option>
                <option value="VOLUME">Trade Volume / Sample Size</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Timeframe</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Target Value</label>
              <input
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Current Value</label>
              <input
                type="number"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl px-3 py-2 focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="%">%</option>
                <option value="$">$</option>
                <option value="trades">trades</option>
                <option value="score">score</option>
              </select>
            </div>
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
              Save Milestone
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
