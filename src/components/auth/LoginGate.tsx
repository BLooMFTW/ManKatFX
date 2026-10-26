import React, { useState } from 'react';
import { Mail, Lock, Shield, ArrowRight, AlertCircle, CheckCircle2, Sparkles, Database } from 'lucide-react';
import { signInUser, resetUserPassword, signInDemoUser } from '../../lib/supabase/authService';
import { getSupabaseConfig } from '../../lib/supabase/client';
import { ScrambleText } from '../ui/ScrambleText';
import { BrandLogo } from '../ui/BrandLogo';

interface LoginGateProps {
  onLoginSuccess: (user?: any) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onLoginSuccess }) => {
  const supabaseConfig = getSupabaseConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleDemoAccess = () => {
    const demoUser = signInDemoUser();
    onLoginSuccess(demoUser);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please provide your trader email address.');
      return;
    }

    if (!isResetMode && !password.trim()) {
      setError('Please provide your terminal password.');
      return;
    }

    if (!supabaseConfig.isConfigured) {
      setError('Supabase credentials not configured yet. Please provide your Supabase URL & Anon Key in chat, or enter via Demo Terminal below.');
      return;
    }

    setIsLoading(true);
    try {
      if (isResetMode) {
        await resetUserPassword(cleanEmail);
        setMessage('Password reset instructions sent. Please inspect your email inbox.');
      } else {
        const { user, error: authError } = await signInUser(cleanEmail, password);
        if (authError) {
          setError(authError.message);
        } else {
          onLoginSuccess(user);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials or use Demo Access.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-zinc-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-[#D4AF37] selection:text-black">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-[#111111]/95 border border-[#252525] rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
        {/* Gold Border Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-t-3xl" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <BrandLogo size="lg" className="mx-auto mb-3" />
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#FFF6DB] via-[#F2D675] to-[#D4AF37] bg-clip-text text-transparent">
              <ScrambleText text="ManKatFx" />
            </h1>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Institutional
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {isResetMode
              ? 'Reset your terminal access password'
              : 'Sign in to access your synchronized journal & analytics'}
          </p>
        </div>

        {/* Unconfigured Key Helper Notice */}
        {!supabaseConfig.isConfigured && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
            <Database className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Supabase Project Pending:</strong> Send your new Supabase Project URL and API Key in the chat to connect live PostgreSQL, or use <strong>Demo Terminal</strong> below.
            </div>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{message}</span>
          </div>
        )}

        {/* Login Form Only */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              <ScrambleText text="Trader Email" />
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@mankatfx.com"
                required
                className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-xs rounded-xl pl-10 pr-3.5 py-2.5 placeholder:text-zinc-600 focus:border-[#D4AF37] focus:outline-none transition"
              />
            </div>
          </div>

          {!isResetMode && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                  <ScrambleText text="Password" />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-[11px] text-[#D4AF37] hover:underline font-mono"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-xs rounded-xl pl-10 pr-3.5 py-2.5 placeholder:text-zinc-600 focus:border-[#D4AF37] focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F2D675] via-[#D4AF37] to-[#B89428] text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isResetMode ? 'Send Password Reset Email' : 'Sign In to Terminal'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>

          {isResetMode && (
            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setError(null);
                setMessage(null);
              }}
              className="w-full text-center text-xs text-zinc-400 hover:text-zinc-200 mt-2 cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </form>

        {/* Demo Terminal Quick Entry */}
        <div className="mt-6 pt-4 border-t border-[#1C1C1C]">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#282828] text-amber-300 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <ScrambleText text="Instant Demo Terminal Access" />
            </span>
          </button>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 pt-3 border-t border-[#191919] flex items-center justify-center gap-2 text-[10px] text-zinc-500">
          <Shield className="w-3.5 h-3.5 text-amber-400/80" />
          <span>
            <ScrambleText text="Strict Session Verification & 256-bit Supabase Encryption" />
          </span>
        </div>
      </div>
    </div>
  );
};
