import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, LogOut, AlertCircle, Loader2, KeyRound, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { getUserPin, setUserPin, fetchUserPin } from '../../lib/supabase/pinService';
import { ScrambleText } from '../ui/ScrambleText';
import { BrandLogo } from '../ui/BrandLogo';

interface PinLockGateProps {
  user: User;
  onUnlock: () => void;
  onLogout: () => void;
}

const MASTER_PASSWORD = (import.meta.env.VITE_MASTER_ADMIN_PASSWORD as string) || 'ManKatFX@admin';

export const PinLockGate: React.FC<PinLockGateProps> = ({ user, onUnlock, onLogout }) => {
  const [existingPin, setExistingPin] = useState<string | null>(() => getUserPin(user));
  const [isLoadingPin, setIsLoadingPin] = useState(!existingPin);

  // PIN States
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupStep, setSetupStep] = useState<'ENTER' | 'CONFIRM'>('ENTER');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot PIN with Master Password State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Fetch PIN from Supabase profiles / metadata on mount
  useEffect(() => {
    let isMounted = true;
    fetchUserPin(user.id)
      .then((remotePin) => {
        if (isMounted) {
          if (remotePin) {
            setExistingPin(remotePin);
          }
          setIsLoadingPin(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingPin(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  const isSettingUp = !existingPin;

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleDigit = useCallback(
    (digit: string) => {
      if (isForgotModalOpen) return;
      setError(null);
      if (isSettingUp) {
        if (setupStep === 'ENTER') {
          if (pin.length < 4) {
            const next = pin + digit;
            setPin(next);
            if (next.length === 4) {
              setTimeout(() => {
                setSetupStep('CONFIRM');
              }, 200);
            }
          }
        } else {
          if (confirmPin.length < 4) {
            const next = confirmPin + digit;
            setConfirmPin(next);
            if (next.length === 4) {
              if (next !== pin) {
                triggerError('PINs do not match. Please re-enter.');
                setTimeout(() => {
                  setConfirmPin('');
                  setSetupStep('ENTER');
                  setPin('');
                }, 900);
              } else {
                // Successfully confirmed -> Save to Supabase & unlock
                setIsSubmitting(true);
                setUserPin(user.id, next)
                  .then(() => {
                    setExistingPin(next);
                    onUnlock();
                  })
                  .catch((err) => {
                    triggerError(err.message || 'Failed to save PIN in Supabase.');
                  })
                  .finally(() => setIsSubmitting(false));
              }
            }
          }
        }
      } else {
        // Verification Mode
        if (pin.length < 4) {
          const next = pin + digit;
          setPin(next);
          if (next.length === 4) {
            if (existingPin && next === existingPin) {
              onUnlock();
            } else {
              triggerError('Incorrect 4-digit PIN. Please try again.');
              setTimeout(() => setPin(''), 600);
            }
          }
        }
      }
    },
    [pin, confirmPin, isSettingUp, setupStep, user.id, existingPin, onUnlock, isForgotModalOpen]
  );

  const handleDelete = useCallback(() => {
    if (isForgotModalOpen) return;
    setError(null);
    if (isSettingUp) {
      if (setupStep === 'CONFIRM') {
        if (confirmPin.length > 0) {
          setConfirmPin((prev) => prev.slice(0, -1));
        } else {
          setSetupStep('ENTER');
        }
      } else {
        setPin((prev) => prev.slice(0, -1));
      }
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  }, [isSettingUp, setupStep, confirmPin.length, isForgotModalOpen]);

  const handleClear = useCallback(() => {
    if (isForgotModalOpen) return;
    setError(null);
    setPin('');
    setConfirmPin('');
    if (isSettingUp) setSetupStep('ENTER');
  }, [isSettingUp, isForgotModalOpen]);

  // Keyboard support for 0-9, Backspace, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isForgotModalOpen) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear, isForgotModalOpen]);

  // Master Password Reset Verification Handler
  const handleVerifyMasterPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (masterPasswordInput.trim() !== MASTER_PASSWORD) {
      setForgotError('Invalid master security password. Access denied.');
      return;
    }

    // Reset PIN and switch to Set New PIN mode
    localStorage.removeItem(`mankatfx_pin_${user.id}`);
    setExistingPin(null);
    setPin('');
    setConfirmPin('');
    setSetupStep('ENTER');
    setMasterPasswordInput('');
    setIsForgotModalOpen(false);
    setResetSuccessMessage('Master password verified. Please create your new 4-digit PIN below.');
    setTimeout(() => setResetSuccessMessage(null), 5000);
  };

  const currentLength = isSettingUp && setupStep === 'CONFIRM' ? confirmPin.length : pin.length;

  if (isLoadingPin) {
    return (
      <div className="min-h-screen bg-[#070707] text-zinc-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
            Synchronizing Terminal Security...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div
        className={`relative w-full max-w-sm bg-[#121212]/95 border border-[#252525] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Top Gold Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-t-3xl" />

        {/* Brand Logo Emblem */}
        <BrandLogo size="md" className="mx-auto mb-3" />

        {/* Title & Prompt with Scramble Effect */}
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">
          {isSettingUp ? (
            setupStep === 'ENTER' ? (
              <ScrambleText text="Create 4-Digit Security PIN" />
            ) : (
              <ScrambleText text="Confirm Your 4-Digit PIN" />
            )
          ) : (
            <ScrambleText text="Enter 4-Digit Security PIN" />
          )}
        </h2>

        <p className="text-xs text-zinc-400 mt-1">
          {isSettingUp
            ? setupStep === 'ENTER'
              ? 'Required to encrypt your session and trading logs in Supabase.'
              : 'Re-enter your 4-digit PIN to verify.'
            : `Terminal locked for ${user.email}`}
        </p>

        {/* Reset Success Feedback */}
        {resetSuccessMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < currentLength;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-[#D4AF37] scale-110 shadow-md shadow-amber-500/40'
                    : 'bg-[#222222] border border-[#333333]'
                }`}
              />
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-1.5 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-[#1A1A1A] border border-[#282828] hover:bg-[#252525] active:scale-95 text-lg font-bold font-mono text-zinc-100 transition flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-[#151515] hover:bg-[#202020] text-zinc-400 hover:text-zinc-200 text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-[#1A1A1A] border border-[#282828] hover:bg-[#252525] active:scale-95 text-lg font-bold font-mono text-zinc-100 transition flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
          >
            0
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[#151515] hover:bg-[#202020] text-zinc-400 hover:text-zinc-200 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Forgot PIN & Sign Out Controls */}
        <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-xs text-zinc-400">
          {!isSettingUp ? (
            <button
              type="button"
              onClick={() => {
                setForgotError(null);
                setMasterPasswordInput('');
                setIsForgotModalOpen(true);
              }}
              className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer font-medium flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Forgot PIN?</span>
            </button>
          ) : (
            <span className="text-[11px] text-zinc-500 font-mono">Any 4 digits</span>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Forgot PIN Master Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-[#131313] border border-[#2C2C2C] rounded-3xl p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-bold text-zinc-100">Master Password Recovery</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
              Enter your master administrative key to bypass the locked PIN and configure a new 4-digit passcode.
            </p>

            {forgotError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{forgotError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyMasterPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Master Password
                </label>
                <input
                  type="password"
                  value={masterPasswordInput}
                  onChange={(e) => setMasterPasswordInput(e.target.value)}
                  placeholder="Enter Master Password"
                  required
                  autoFocus
                  className="w-full bg-[#1A1A1A] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B] text-zinc-400 hover:text-zinc-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-extrabold text-xs shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
                >
                  Verify Master Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
