import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Modal } from '../ui/Modal';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getUserPin, setUserPin, fetchUserPin } from '../../lib/supabase/pinService';
import { ScrambleText } from '../ui/ScrambleText';

interface ResetPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: () => void;
}

export const ResetPinModal: React.FC<ResetPinModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [currentPin, setCurrentPin] = useState<string | null>(() => getUserPin(user));
  const [existingPinInput, setExistingPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserPin(user.id).then((pin) => {
        if (pin) setCurrentPin(pin);
      });
    }
  }, [isOpen, user.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

const MASTER_PASSWORD = (import.meta.env.VITE_MASTER_ADMIN_PASSWORD as string) || 'ManKatFX@admin';

    if (currentPin && existingPinInput !== currentPin && existingPinInput !== MASTER_PASSWORD) {
      setError('Current PIN or Master Password is incorrect.');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 numeric digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PIN and confirmation PIN do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setUserPin(user.id, newPin);
      setCurrentPin(newPin);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setExistingPinInput('');
        setNewPin('');
        setConfirmPin('');
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to update PIN in Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset 4-Digit Security PIN"
      subtitle="Update the passcode saved in Supabase required to unlock your session."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <ScrambleText text="4-Digit PIN updated in Supabase successfully!" />
            </span>
          </div>
        )}

        {currentPin && (
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              <ScrambleText text="Current 4-Digit PIN" />
            </label>
            <input
              type="password"
              maxLength={4}
              value={existingPinInput}
              onChange={(e) => setExistingPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-center font-mono text-base tracking-widest rounded-xl py-2.5 focus:border-[#D4AF37] focus:outline-none"
              required
            />
          </div>
        )}

        <div>
          <label className="block font-semibold text-zinc-300 mb-1">
            <ScrambleText text="New 4-Digit PIN" />
          </label>
          <input
            type="password"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-center font-mono text-base tracking-widest rounded-xl py-2.5 focus:border-[#D4AF37] focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-zinc-300 mb-1">
            <ScrambleText text="Confirm New 4-Digit PIN" />
          </label>
          <input
            type="password"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full bg-[#181818] border border-[#2A2A2A] text-zinc-100 text-center font-mono text-base tracking-widest rounded-xl py-2.5 focus:border-[#D4AF37] focus:outline-none"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#222]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B] text-zinc-300 hover:text-zinc-100 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold shadow-md hover:brightness-105 active:scale-95 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Syncing Supabase...' : 'Save New PIN'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
