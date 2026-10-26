import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Download,
  Upload,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  Copy,
} from 'lucide-react';
import { Trade, AssetClass, TradeDirection, TradeStatus } from '../../types/trade';
import { formatCurrency, formatRR, formatDate } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { exportTradesToCSV, parseCSVToTrades } from '../../utils/csvParser';
import { ConfirmModal } from '../ui/ConfirmModal';
import { RollingNumber } from '../ui/RollingNumber';
import { ScrambleText } from '../ui/ScrambleText';

interface JournalViewProps {
  trades: Trade[];
  onOpenTradeModal: () => void;
  onEditTrade: (trade: Trade) => void;
  onDuplicateTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onSelectTrade: (trade: Trade) => void;
  onImportTrades: (trades: Trade[]) => Promise<void>;
  currentUserId: string;
  currentAccountId: string;
}

export const JournalView: React.FC<JournalViewProps> = ({
  trades,
  onOpenTradeModal,
  onEditTrade,
  onDuplicateTrade,
  onDeleteTrade,
  onSelectTrade,
  onImportTrades,
  currentUserId,
  currentAccountId,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TradeStatus>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | TradeDirection>('ALL');
  const [assetClassFilter, setAssetClassFilter] = useState<'ALL' | AssetClass>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'rr'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Sort
  const filteredTrades = useMemo(() => {
    return trades
      .filter((t) => {
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
        if (directionFilter !== 'ALL' && t.direction !== directionFilter) return false;
        if (assetClassFilter !== 'ALL' && t.assetClass !== assetClassFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchSym = t.symbol.toLowerCase().includes(q);
          const matchStrat = (t.strategy || '').toLowerCase().includes(q);
          const matchSetup = (t.setupType || '').toLowerCase().includes(q);
          const matchNotes = (t.notes || '').toLowerCase().includes(q);
          const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
          if (!matchSym && !matchStrat && !matchSetup && !matchNotes && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') {
          diff = new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
        } else if (sortBy === 'pnl') {
          diff = b.netPnL - a.netPnL;
        } else if (sortBy === 'rr') {
          diff = (b.realizedRR || 0) - (a.realizedRR || 0);
        }
        return sortOrder === 'desc' ? diff : -diff;
      });
  }, [trades, statusFilter, directionFilter, assetClassFilter, search, sortBy, sortOrder]);

  const handleExportCSV = () => {
    const csv = exportTradesToCSV(filteredTrades);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ManKatFx_Trades_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        try {
          const imported = parseCSVToTrades(text, currentUserId, currentAccountId);
          if (imported.length > 0) {
            await onImportTrades(imported);
            setNotification({ text: `Successfully imported ${imported.length} trades!`, type: 'success' });
            setTimeout(() => setNotification(null), 4000);
          } else {
            setNotification({ text: 'No valid trade rows detected in CSV.', type: 'error' });
            setTimeout(() => setNotification(null), 4000);
          }
        } catch {
          setNotification({ text: 'Error parsing CSV file. Please verify column format.', type: 'error' });
          setTimeout(() => setNotification(null), 4000);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center p-3.5 sm:p-4 rounded-2xl bg-[#121212] border border-[#222]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by symbol, setup, tags..."
            className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 placeholder-zinc-500 text-xs rounded-xl pl-9 pr-4 py-2 sm:py-2.5 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        {/* Filter Chips & Export/Import */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#181818] border border-[#2A2A2A] text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 sm:py-2 focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open Only</option>
            <option value="CLOSED">Closed Only</option>
          </select>

          {/* Direction filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value as any)}
            className="bg-[#181818] border border-[#2A2A2A] text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 sm:py-2 focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="ALL">All Sides</option>
            <option value="LONG">Longs Only</option>
            <option value="SHORT">Shorts Only</option>
          </select>

          {/* CSV Import / Export */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import trades from CSV"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#181818] border border-[#2A2A2A] text-zinc-300 hover:text-zinc-100 text-xs font-medium transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">
              <ScrambleText text="Import" />
            </span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Export trades to CSV"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#181818] border border-[#2A2A2A] text-zinc-300 hover:text-zinc-100 text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">
              <ScrambleText text="Export" />
            </span>
          </button>

          <button
            onClick={onOpenTradeModal}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">
              <ScrambleText text="Log Trade" />
            </span>
            <span className="sm:hidden">
              <ScrambleText text="Log" />
            </span>
          </button>
        </div>
      </div>

      {/* Record Counter Badge */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <div>
          <ScrambleText text="Showing" />{' '}
          <strong className="text-zinc-200 font-mono">
            <RollingNumber value={filteredTrades.length} decimals={0} />
          </strong>{' '}
          <ScrambleText text="recorded executions" />
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* MOBILE LIST VIEW (< 768px) */}
      <div className="block md:hidden space-y-2.5">
        {filteredTrades.map((t) => (
          <div
            key={`mob-${t.id}`}
            onClick={() => onSelectTrade(t)}
            className="p-3.5 rounded-2xl bg-[#131313] border border-[#242424] active:scale-[0.99] transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={t.direction === 'LONG' ? 'green' : 'red'} size="sm">
                  {t.direction === 'LONG' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {t.direction}
                </Badge>
                <span className="font-mono font-bold text-sm text-zinc-100">{t.symbol}</span>
                <span className="text-[9px] uppercase px-1 rounded bg-[#202020] text-zinc-400">
                  {t.assetClass}
                </span>
              </div>

              <div className="text-right font-mono">
                {t.status === 'OPEN' ? (
                  <Badge variant="gold" size="sm">OPEN</Badge>
                ) : (
                  <RollingNumber value={t.netPnL} prefix="$" colorCode />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <div>
                <span>{formatDate(t.entryDate)}</span>
                <span className="text-zinc-500 ml-1.5">({t.entryTime || '09:00'})</span>
              </div>

              <div className="flex items-center gap-2">
                {t.realizedRR ? (
                  <RollingNumber
                    value={t.realizedRR}
                    prefix={t.realizedRR > 0 ? '+' : ''}
                    suffix="R"
                    colorCode
                    decimals={2}
                  />
                ) : null}
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300 font-semibold">{t.strategy || 'Discretionary'}</span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div
              className="mt-3 pt-2.5 border-t border-[#1F1F1F] flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] text-zinc-500">
                Score:{' '}
                <span className="text-zinc-300 font-bold font-mono">
                  <RollingNumber value={t.ruleFollowingScore ?? 5} decimals={0} />/5
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTrade(t);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#282828] text-amber-300 hover:text-amber-200 text-xs font-semibold cursor-pointer"
                >
                  <ScrambleText text="Edit" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateTrade(t);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#282828] text-zinc-300 hover:text-zinc-100 text-xs font-medium cursor-pointer"
                >
                  <ScrambleText text="Duplicate" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingTradeId(t.id);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold cursor-pointer"
                >
                  <ScrambleText text="Delete" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTrades.length === 0 && (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#131313] border border-[#222]">
            <p className="text-sm font-semibold text-zinc-300">
              <ScrambleText text="No matching trades" />
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              <ScrambleText text="Adjust filters or log a new trade." />
            </p>
            <button
              onClick={onOpenTradeModal}
              className="mt-3 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold"
            >
              <ScrambleText text="+ Log Trade" />
            </button>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (>= 768px) */}
      <div className="hidden md:block rounded-2xl bg-[#131313] border border-[#222] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#181818] border-b border-[#242424] text-zinc-400 uppercase text-[10px] tracking-wider font-semibold select-none">
                <th className="py-3 px-4">
                  <ScrambleText text="Date / Time" />
                </th>
                <th className="py-3 px-4">
                  <ScrambleText text="Symbol / Class" />
                </th>
                <th className="py-3 px-4">
                  <ScrambleText text="Direction" />
                </th>
                <th className="py-3 px-4">
                  <ScrambleText text="Entry / Exit" />
                </th>
                <th className="py-3 px-4">
                  <ScrambleText text="Position / Lots" />
                </th>
                <th className="py-3 px-4">
                  <ScrambleText text="Planned R:R" />
                </th>
                <th className="py-3 px-4">
                  <ScrambleText text="Realized R:R" />
                </th>
                <th className="py-3 px-4 text-right">
                  <ScrambleText text="Net P&L" />
                </th>
                <th className="py-3 px-4 text-center">
                  <ScrambleText text="Score" />
                </th>
                <th className="py-3 px-4 text-right">
                  <ScrambleText text="Actions" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {filteredTrades.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onSelectTrade(t)}
                  className="hover:bg-[#1A1A1A]/80 transition cursor-pointer group"
                >
                  {/* Date */}
                  <td className="py-3.5 px-4 font-mono text-zinc-300">
                    <span className="block font-medium">{formatDate(t.entryDate)}</span>
                    <span className="text-[10px] text-zinc-400">{t.entryTime || '09:00'} UTC</span>
                  </td>

                  {/* Symbol */}
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-zinc-100 text-sm">{t.symbol}</span>
                      <span className="text-[9px] uppercase px-1 rounded bg-[#202020] text-zinc-400">
                        {t.assetClass}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block truncate max-w-[120px]">
                      {t.strategy || 'Discretionary'}
                    </span>
                  </td>

                  {/* Direction */}
                  <td className="py-3.5 px-4">
                    <Badge variant={t.direction === 'LONG' ? 'green' : 'red'} size="sm">
                      {t.direction === 'LONG' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.direction}
                    </Badge>
                  </td>

                  {/* Entry / Exit */}
                  <td className="py-3.5 px-4 font-mono text-zinc-300">
                    <div>Entry: {t.entryPrice}</div>
                    <div className="text-[10px] text-zinc-400">
                      Exit: {t.status === 'OPEN' ? <span className="text-amber-400">Active</span> : t.exitPrice}
                    </div>
                  </td>

                  {/* Size */}
                  <td className="py-3.5 px-4 font-mono text-zinc-300">
                    <div>
                      {t.lotSize ? (
                        <>
                          <RollingNumber value={t.lotSize} decimals={2} /> Lots
                        </>
                      ) : (
                        <>
                          <RollingNumber value={t.quantity} decimals={0} /> Units
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Fees: <RollingNumber value={(t.commission || 0) + (t.swap || 0)} prefix="$" decimals={2} />
                    </div>
                  </td>

                  {/* Planned R:R */}
                  <td className="py-3.5 px-4 font-mono text-amber-300 font-semibold">
                    {formatRR(t.plannedRR)}
                  </td>

                  {/* Realized R:R */}
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {t.status === 'OPEN' ? (
                      <span className="text-amber-400">In Play</span>
                    ) : t.realizedRR ? (
                      <RollingNumber
                        value={t.realizedRR}
                        prefix={t.realizedRR > 0 ? '+' : ''}
                        suffix="R"
                        decimals={2}
                        colorCode
                      />
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Net P&L */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                    {t.status === 'OPEN' ? (
                      <Badge variant="gold" size="sm">OPEN</Badge>
                    ) : (
                      <RollingNumber value={t.netPnL} prefix="$" colorCode />
                    )}
                  </td>

                  {/* Discipline Score */}
                  <td className="py-3.5 px-4 text-center font-mono text-zinc-300 font-medium">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[11px]">
                      <RollingNumber value={t.ruleFollowingScore ?? 5} decimals={0} />/5
                    </span>
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTrade(t);
                        }}
                        title="Edit trade"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateTrade(t);
                        }}
                        title="Duplicate trade"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTradeId(t.id);
                        }}
                        title="Delete trade"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrades.length === 0 && (
          <div className="text-center py-16 px-4">
            <p className="text-sm font-semibold text-zinc-300">
              <ScrambleText text="No matching trades found" />
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              <ScrambleText text="Adjust search filters or log your first institutional trade." />
            </p>
            <button
              onClick={onOpenTradeModal}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/20 transition cursor-pointer"
            >
              <ScrambleText text="+ Log Trade Now" />
            </button>
          </div>
        )}
      </div>

      {/* In-app Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingTradeId}
        onClose={() => setDeletingTradeId(null)}
        onConfirm={() => {
          if (deletingTradeId) {
            onDeleteTrade(deletingTradeId);
            setDeletingTradeId(null);
          }
        }}
        title="Delete Journal Record"
        message="Are you sure you want to permanently delete this trade record from your journal and Supabase database? This action cannot be undone."
        confirmText="Delete Record"
      />
    </div>
  );
};
