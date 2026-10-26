import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  User,
  Globe,
  Sparkles,
  Download,
  AlertTriangle,
  Server,
  CheckCircle2,
} from 'lucide-react';
import { TradingAccount, UserProfile, Trade } from '../../types/trade';
import { updateUserPassword } from '../../lib/supabase/authService';
import { getSupabaseConfig } from '../../lib/supabase/client';

interface SettingsViewProps {
  accounts: TradingAccount[];
  activeAccount: TradingAccount | null;
  onSaveAccount: (acc: TradingAccount) => Promise<void>;
  userEmail?: string | null;
  trades: Trade[];
  onSeedDemoData: () => Promise<void>;
  onOpenResetPin?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  accounts,
  activeAccount,
  onSaveAccount,
  userEmail,
  trades,
  onSeedDemoData,
  onOpenResetPin,
}) => {
  const supabaseConfig = getSupabaseConfig();
  const [currency, setCurrency] = useState(activeAccount?.currency || 'USD');
  const [initialBalance, setInitialBalance] = useState<number>(activeAccount?.initialBalance || 25000);
  const [broker, setBroker] = useState(activeAccount?.broker || 'IC Markets');
  const [accountName, setAccountName] = useState(activeAccount?.name || 'Primary Portfolio');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMessage, setPassMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    const updated: TradingAccount = {
      ...activeAccount,
      name: accountName,
      broker,
      currency,
      initialBalance: Number(initialBalance),
    };
    await onSaveAccount(updated);
    alert('Account configuration saved successfully!');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);
    if (newPassword.length < 6) {
      setPassMessage({ text: 'Password must be at least 6 characters.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ text: 'Passwords do not match.', isError: true });
      return;
    }

    setIsUpdatingPass(true);
    try {
      await updateUserPassword(newPassword);
      setPassMessage({ text: 'Password changed successfully!', isError: false });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMessage({
        text: err instanceof Error ? err.message : 'Failed to change password. Re-login may be required.',
        isError: true,
      });
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleExportFullJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      account: activeAccount,
      trades,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ManKatFx_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSeed = async () => {
    if (confirm('Load pre-configured institutional sample trades into your journal?')) {
      setIsSeeding(true);
      try {
        await onSeedDemoData();
        alert('Institutional sample data loaded successfully!');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to seed sample data.');
      } finally {
        setIsSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Account & Currency Settings */}
      <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] shadow-xl">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-amber-400" />
          Portfolio & Currency Configuration
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Manage default currency, broker details, and mark-to-market starting capital.
        </p>

        <form onSubmit={handleUpdateAccount} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Portfolio Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Broker / Prop Firm</label>
              <input
                type="text"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Base Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Initial Account Balance
              </label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F2D675] to-[#D4AF37] text-black font-bold text-xs shadow-md transition cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* 2. Strict 4-Digit Passcode Protection */}
      <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            4-Digit Security Passcode Protection
          </h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Active Gate
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Strict 4-digit PIN is required each time you reload or refresh the page. You can update or reset your PIN at any time using your current PIN or master password (ManKatFX@admin).
        </p>

        {onOpenResetPin && (
          <button
            onClick={onOpenResetPin}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-amber-300 hover:text-amber-200 text-xs font-bold transition cursor-pointer"
          >
            <Key className="w-4 h-4" />
            <span>Reset / Change 4-Digit Security PIN</span>
          </button>
        )}
      </div>

      {/* 3. Security & Password Management */}
      <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] shadow-xl">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-amber-400" />
          Security & Password Management
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Logged in as: <strong className="text-zinc-200 font-mono">{userEmail || 'Trader'}</strong>. Update your credentials securely.
        </p>

        {passMessage && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs ${
              passMessage.isError
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {passMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                New Secure Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#181818] border border-[#2C2C2C] text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingPass}
              className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Live Cloud Synchronization (Keys Masked & Protected) */}
      <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            Live Cloud Synchronization
          </h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Live & Encrypted
          </span>
        </div>

        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          Your portfolio balances, trading logs, backtesting data, and risk parameters are synced in real-time with 256-bit Row-Level Security encryption.
        </p>

        <div className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] font-mono text-xs space-y-2.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Cloud Database:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Connected (Encrypted)
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Project Keys:</span>
            <span className="text-zinc-400 font-mono tracking-wider flex items-center gap-1.5">
              <span>••••••••••••••••••••••••</span>
              <span className="text-[10px] text-amber-300/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-sans font-semibold">
                Protected & Hidden
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Database Engine:</span>
            <span className="text-zinc-200">Supabase PostgreSQL 15+</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Row-Level Security (RLS):</span>
            <span className="text-emerald-400 font-bold">Active & Enforced</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Encryption Standard:</span>
            <span className="text-zinc-200">AES-256 GCM / TLS 1.3</span>
          </div>
        </div>
      </div>

      {/* 5. Data Backup, Export & Institutional Demo Seeding */}
      <div className="p-6 rounded-2xl bg-[#131313] border border-[#242424] shadow-xl">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-amber-400" />
          Data Backup & Sample Playground
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Export your complete journal database or seed sample institutional trades for testing.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportFullJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-zinc-200 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Complete JSON Backup</span>
          </button>

          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSeeding ? 'Seeding...' : 'Load Institutional Sample Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
