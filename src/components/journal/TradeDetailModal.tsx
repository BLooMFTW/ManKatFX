import React from 'react';
import { Modal } from '../ui/Modal';
import { Trade } from '../../types/trade';
import { formatCurrency, formatPercent, formatRR, formatDate } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Edit2, Copy, Trash2, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

interface TradeDetailModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onDuplicate: (trade: Trade) => void;
  onDelete: (tradeId: string) => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  trade,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  if (!trade) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${trade.symbol} Execution Record`}
      subtitle={`Logged on ${formatDate(trade.entryDate)} at ${trade.entryTime || '00:00'}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <Badge variant={trade.direction === 'LONG' ? 'green' : 'red'} size="md">
              {trade.direction === 'LONG' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {trade.direction}
            </Badge>
            <Badge variant={trade.status === 'OPEN' ? 'gold' : 'zinc'} size="md">
              {trade.status}
            </Badge>
            <span className="text-xs font-semibold text-zinc-400">{trade.assetClass}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Net P&L</span>
            <span
              className={`font-mono text-xl font-bold ${
                trade.status === 'OPEN'
                  ? 'text-amber-400'
                  : trade.netPnL >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {trade.status === 'OPEN' ? 'OPEN POSITION' : formatCurrency(trade.netPnL, 'USD', true)}
            </span>
          </div>
        </div>

        {/* Price & Execution Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#151515] border border-[#242424] text-xs">
          <div>
            <span className="text-zinc-400 block text-[10px]">Entry Price</span>
            <span className="font-mono font-bold text-zinc-100">{trade.entryPrice}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px]">Exit Price</span>
            <span className="font-mono font-bold text-zinc-100">{trade.exitPrice ?? 'Active'}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px]">Stop Loss</span>
            <span className="font-mono text-rose-300 font-semibold">{trade.stopLoss ?? 'None'}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px]">Take Profit</span>
            <span className="font-mono text-emerald-300 font-semibold">{trade.takeProfit ?? 'None'}</span>
          </div>

          <div className="pt-2 border-t border-[#222]">
            <span className="text-zinc-400 block text-[10px]">Planned R:R</span>
            <span className="font-mono text-amber-300 font-semibold">{formatRR(trade.plannedRR)}</span>
          </div>
          <div className="pt-2 border-t border-[#222]">
            <span className="text-zinc-400 block text-[10px]">Realized R:R</span>
            <span
              className={`font-mono font-semibold ${
                trade.realizedRR && trade.realizedRR > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trade.realizedRR ? `${trade.realizedRR > 0 ? '+' : ''}${trade.realizedRR}R` : '—'}
            </span>
          </div>
          <div className="pt-2 border-t border-[#222]">
            <span className="text-zinc-400 block text-[10px]">Position Size / Lots</span>
            <span className="font-mono text-zinc-200">
              {trade.quantity} ({trade.lotSize ?? 1} Lots)
            </span>
          </div>
          <div className="pt-2 border-t border-[#222]">
            <span className="text-zinc-400 block text-[10px]">Fees (Comm/Swap)</span>
            <span className="font-mono text-zinc-400">
              {formatCurrency((trade.commission || 0) + (trade.swap || 0))}
            </span>
          </div>
        </div>

        {/* Strategy & Market Context */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#171717] border border-[#242424]">
            <span className="text-zinc-400 block text-[10px]">Strategy</span>
            <span className="font-semibold text-zinc-100">{trade.strategy || 'Discretionary'}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#171717] border border-[#242424]">
            <span className="text-zinc-400 block text-[10px]">Setup Model</span>
            <span className="font-semibold text-zinc-100">{trade.setupType || 'Standard'}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#171717] border border-[#242424]">
            <span className="text-zinc-400 block text-[10px]">Market Session</span>
            <span className="font-semibold text-amber-300">{trade.session || 'London'}</span>
          </div>
        </div>

        {/* Psychology & Discipline */}
        <div className="p-4 rounded-xl bg-[#151515] border border-[#242424] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300">Psychology & Rule Execution</span>
            <span className="text-amber-400 font-mono font-bold">
              Discipline Score: {trade.ruleFollowingScore ?? 5}/5
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 block text-[10px]">Mindset Before Entry</span>
              <span className="text-zinc-200 font-medium">{trade.emotionBefore || 'Calm'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px]">Mindset After Exit</span>
              <span className="text-zinc-200 font-medium">{trade.emotionAfter || 'Disciplined'}</span>
            </div>
          </div>
        </div>

        {/* Reasons & Reflections */}
        {(trade.entryReason || trade.exitReason || trade.mistakes || trade.lessons) && (
          <div className="space-y-3 text-xs">
            {trade.entryReason && (
              <div className="p-3 rounded-xl bg-[#161616] border border-[#222]">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">
                  Entry Thesis
                </span>
                <p className="text-zinc-200 leading-relaxed">{trade.entryReason}</p>
              </div>
            )}
            {trade.exitReason && (
              <div className="p-3 rounded-xl bg-[#161616] border border-[#222]">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">
                  Exit Management
                </span>
                <p className="text-zinc-200 leading-relaxed">{trade.exitReason}</p>
              </div>
            )}
            {trade.mistakes && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <span className="text-[10px] uppercase font-semibold block mb-0.5">Mistakes</span>
                <p>{trade.mistakes}</p>
              </div>
            )}
            {trade.lessons && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <span className="text-[10px] uppercase font-semibold block mb-0.5">Key Lessons</span>
                <p>{trade.lessons}</p>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {trade.tags && trade.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tag className="w-3.5 h-3.5 text-zinc-400 mr-1" />
            {trade.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-md bg-[#1C1C1C] border border-[#2B2B2B] text-zinc-300 font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#222]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDelete(trade.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Trade</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDuplicate(trade);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => {
                onEdit(trade);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
