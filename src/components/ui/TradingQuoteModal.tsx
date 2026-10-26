import React, { useEffect, useState } from 'react';
import { Quote, Sparkles, X } from 'lucide-react';
import { ScrambleText } from './ScrambleText';
import { BrandLogo } from './BrandLogo';

export interface TradingQuote {
  text: string;
  author: string;
  title: string;
}

export const TRADING_QUOTES: TradingQuote[] = [
  {
    text: 'When you genuinely accept the risks, you will be at peace with any outcome.',
    author: 'Mark Douglas',
    title: 'Author of Trading in the Zone',
  },
  {
    text: "Don't focus on making money; focus on protecting what you have. Risk management is everything.",
    author: 'Paul Tudor Jones',
    title: 'Founder, Tudor Investment Corp',
  },
  {
    text: 'It was never my thinking that made the big money for me. It also was my sitting. Got that? My sitting tight!',
    author: 'Jesse Livermore',
    title: 'Legendary Wall Street Trader',
  },
  {
    text: 'Win or lose, everybody gets what they want out of the market. Some people seem to like to lose, so they win by losing money.',
    author: 'Ed Seykota',
    title: 'Pioneer of Systematic Trend Following',
  },
  {
    text: "It’s not whether you're right or wrong, but how much money you make when you're right and how much you lose when you're wrong.",
    author: 'Stanley Druckenmiller',
    title: 'Chairman, Duquesne Family Office',
  },
  {
    text: 'I could publish trading rules in the newspaper and no one would follow them. The key is consistency and strict discipline.',
    author: 'Richard Dennis',
    title: 'Founder, The Turtle Traders',
  },
  {
    text: 'My experience with novice traders is that they trade 3 to 5 times too big. Always cut your size and protect capital.',
    author: 'Bruce Kovner',
    title: 'Chairman, Caxton Associates',
  },
  {
    text: 'If you can’t sleep at night because of your positions, you have taken on too much risk. Cut back until you sleep soundly.',
    author: 'Tom Basso',
    title: 'Mr. Serenity, Market Wizard',
  },
  {
    text: 'The elements of good trading are: 1. Cutting losses, 2. Cutting losses, and 3. Cutting losses.',
    author: 'Ed Seykota',
    title: 'Market Wizard',
  },
  {
    text: 'Amateurs focus on how much money they can make. Professionals focus on how much money they can lose.',
    author: 'Mark Minervini',
    title: 'U.S. Investing Champion',
  },
  {
    text: 'The goal of a successful trader is to make the best trades. Money is secondary.',
    author: 'Alexander Elder',
    title: 'Author, Trading for a Living',
  },
  {
    text: 'Never let a win get to your head or a loss get to your heart.',
    author: 'Michael Marcus',
    title: 'Commodities Corporation Wizard',
  },
];

interface TradingQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TradingQuoteModal: React.FC<TradingQuoteModalProps> = ({ isOpen, onClose }) => {
  const [quote, setQuote] = useState<TradingQuote>(TRADING_QUOTES[0]);
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Pick a different quote every time
      const lastIndexStr = sessionStorage.getItem('mankatfx_last_quote_idx');
      const lastIdx = lastIndexStr !== null ? parseInt(lastIndexStr, 10) : -1;
      let newIdx = Math.floor(Math.random() * TRADING_QUOTES.length);
      if (newIdx === lastIdx && TRADING_QUOTES.length > 1) {
        newIdx = (newIdx + 1) % TRADING_QUOTES.length;
      }
      sessionStorage.setItem('mankatfx_last_quote_idx', String(newIdx));
      setQuote(TRADING_QUOTES[newIdx]);

      // Fast fade in
      setIsVisible(true);
      setIsFadingOut(false);

      // Start fade out after 2700ms so it smoothly leaves by 3000ms
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2700);

      // Complete close after exactly 3000ms (3 seconds)
      const closeTimer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 3000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(closeTimer);
      };
    } else {
      setIsVisible(false);
      setIsFadingOut(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen && !isVisible) return null;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300 cursor-pointer ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg bg-[#111111] border border-[#2D2D2D] rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden transform transition-all duration-300 ${
          isFadingOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Animated Gold Progress Top Bar (3s Countdown) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#202020]">
          <div className="h-full bg-gradient-to-r from-[#F2D675] via-[#D4AF37] to-[#8C6D1F] animate-[shrink_3s_linear_forwards]" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-[#1A1A1A] transition cursor-pointer"
          title="Dismiss (or auto-closes in 3s)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Emblem */}
        <BrandLogo size="xs" className="mx-auto mb-2 opacity-90" />

        {/* Quote Icon with Ambient Glow */}
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#F2D675]/20 via-[#D4AF37]/10 to-transparent border border-amber-500/30 flex items-center justify-center text-[#D4AF37] shadow-lg shadow-amber-500/10 mb-3">
          <Quote className="w-5 h-5 rotate-180" />
        </div>

        {/* Tag */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest mb-3">
          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
          <span>Mindset & Discipline</span>
        </div>

        {/* Quote Text */}
        <blockquote className="text-base sm:text-lg font-serif italic text-zinc-100 leading-relaxed px-2">
          "{quote.text}"
        </blockquote>

        {/* Author & Title */}
        <div className="mt-5 pt-4 border-t border-[#1F1F1F]">
          <p className="font-bold text-xs uppercase tracking-wider text-[#D4AF37] font-mono">
            <ScrambleText text={quote.author} duration={400} />
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">{quote.title}</p>
        </div>

        {/* Auto dismiss countdown pill */}
        <p className="text-[10px] text-zinc-400 mt-4 font-mono">
          Terminal unlocked   Auto-closing in 3s
        </p>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
