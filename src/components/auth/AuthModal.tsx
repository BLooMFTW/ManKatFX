import React, { useState } from 'react';
import {
  signUpUser,
  signInUser,
  resetUserPassword,
  validateInitialAccessCode,
} from '../../lib/supabase/authService';
import { Shield, Key, Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  isInitialInvitationGate?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RESET'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // If invitation gate requires code check for registration
    if (mode === 'REGISTER' && accessCode) {
      if (!validateInitialAccessCode(accessCode)) {
        setError('Invalid initial access invitation code. Please use 259300 or leave empty.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'LOGIN') {
        const { error: err } = await signInUser(email, password);
        if (err) {
          setError(err.message);
        } else {
          onSuccess();
        }
      } else if (mode === 'REGISTER') {
        const { error: err } = await signUpUser(email, password, displayName);
        if (err) {
          setError(err.message);
        } else {
          setSuccessMsg('Account created successfully!');
          setTimeout(() => onSuccess(), 500);
        }
      } else if (mode === 'RESET') {
        await resetUserPassword(email);
        setSuccessMsg('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#121212] border border-[#2A2A2A] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Gold Top Light */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#F2D675] via-[#D4AF37] to-[#8C6D1F] flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
            <span className="font-extrabold text-black text-2xl tracking-tighter">M</span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100 tracking-tight">ManKatFx</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Supabase Powered Trading Journal & Analytics</p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#181818] rounded-xl border border-[#242424] mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'LOGIN' ? 'bg-[#D4AF37] text-black font-bold shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'REGISTER' ? 'bg-[#D4AF37] text-black font-bold shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'REGISTER' && (
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Your Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Senior Prop Trader"
                  className="w-full bg-[#181818] border border-[#282828] text-zinc-100 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@mankatfx.com"
                className="w-full bg-[#181818] border border-[#282828] text-zinc-100 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                required
              />
            </div>
          </div>

          {mode !== 'RESET' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-zinc-300">Password</label>
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => setMode('RESET')}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#181818] border border-[#282828] text-zinc-100 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'REGISTER' && (
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Access Code <span className="text-zinc-500 font-normal">(Initial Access Credential)</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="259300"
                  className="w-full bg-[#181818] border border-[#282828] text-zinc-100 font-mono text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F2D675] via-[#D4AF37] to-[#B89428] text-[#090909] font-bold text-xs shadow-lg shadow-amber-500/10 hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading
              ? 'Authenticating...'
              : mode === 'LOGIN'
              ? 'Sign In to Terminal'
              : mode === 'REGISTER'
              ? 'Create Trader Account'
              : 'Send Reset Link'}
          </button>
        </form>

        {onClose && (
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
