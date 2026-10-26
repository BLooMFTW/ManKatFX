import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Wifi,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { marketService } from '../../lib/market/marketService';
import { MarketQuote } from '../../types/market';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { RollingNumber } from '../ui/RollingNumber';
import { Badge } from '../ui/Badge';

export const MarketWatchView: React.FC = () => {
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>(marketService.getQuotes());
  const [selectedCategory, setSelectedCategory] = useState<
    'ALL' | 'FOREX' | 'CRYPTO' | 'METALS' | 'INDICES'
  >('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = marketService.subscribe((updated) => {
      setQuotes(updated);
    });
    return () => unsub();
  }, []);

  const quoteList = Object.values(quotes);

  const filtered = quoteList.filter((q) => {
    if (selectedCategory !== 'ALL' && q.category !== selectedCategory) return false;
    if (search.trim()) {
      const query = search.toLowerCase();
      return (
        q.symbol.toLowerCase().includes(query) ||
        q.name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Live Provider Transparency Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121212] border border-[#222]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-100">Live Institutional Market Stream</span>
              <Badge variant="green" size="sm">
                0s Real-Time
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Provider: Binance Public WebSocket (Crypto) & Interbank Top-of-Book BBO Feeds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Synced: {new Date().toUTCString().slice(17, 25)} UTC</span>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#121212] border border-[#222]">
          {(['ALL', 'FOREX', 'CRYPTO', 'METALS', 'INDICES'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181818]'
              }`}
            >
              {cat === 'ALL' ? 'All Symbols' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol (EUR, BTC, XAU)..."
            className="w-full bg-[#141414] border border-[#252525] text-zinc-100 text-xs rounded-xl pl-9 pr-3 py-2 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
      </div>

      {/* Market Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((item) => {
          const isPos = item.dailyChangePercent >= 0;
          return (
            <div
              key={item.symbol}
              className="p-5 rounded-2xl bg-[#131313] border border-[#222] hover:border-[#D4AF37]/50 transition shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-zinc-100">
                      {item.symbol}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#1C1C1C] text-zinc-400 font-semibold">
                      {item.category}
                    </span>
                  </div>
                  <Badge variant={isPos ? 'green' : 'red'} size="sm">
                    {isPos ? '+' : ''}
                    {item.dailyChangePercent.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 truncate">{item.name}</p>

                {/* Price Display */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-sans uppercase">
                      Last Price
                    </span>
                    <span className="text-xl font-mono font-bold text-zinc-100">
                      <RollingNumber
                        value={item.lastPrice}
                        decimals={item.lastPrice > 100 ? (item.lastPrice > 1000 ? 1 : 2) : 4}
                      />
                    </span>
                  </div>

                  {/* Sparkline Visual */}
                  {item.sparkline && (
                    <div className="flex items-end gap-1 h-8 w-24">
                      {item.sparkline.slice(-10).map((v, i) => {
                        const min = Math.min(...item.sparkline!);
                        const max = Math.max(...item.sparkline!);
                        const pct = max > min ? ((v - min) / (max - min)) * 100 : 50;
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-sm ${
                              isPos ? 'bg-emerald-500/60' : 'bg-rose-500/60'
                            }`}
                            style={{ height: `${Math.max(15, pct)}%` }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Bid / Ask & Spread Footer */}
              <div className="mt-4 pt-3 border-t border-[#202020] grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">Bid</span>
                  <span className="text-zinc-300 font-medium">{item.bid}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[9px] uppercase">Ask</span>
                  <span className="text-zinc-300 font-medium">{item.ask}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
