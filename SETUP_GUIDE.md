# ManKatFx — Production Architecture & Backend Setup Guide

Welcome to **ManKatFx**, an institutional-grade trading journal and performance analytics SaaS designed for proprietary firm traders, retail forex/crypto operators, and quantitative analysts.

---

## 1. Security Architecture & API Key Storage

### Where API Keys Are Stored
1. **Local Environment Variables**:
   Stored in `.env.local` (ignored by git so secrets are never committed publicly):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://enhuelgxgnncufskrmdv.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Z3Yg5Kw5npYhnNFdCBITpA_HVddmKG4
   VITE_SUPABASE_URL=https://enhuelgxgnncufskrmdv.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_Z3Yg5Kw5npYhnNFdCBITpA_HVddmKG4
   APP_URL=MY_APP_URL
   ```

2. **Client-Side Defaults**:
   Baked directly into `src/lib/supabase/client.ts` as permanent production fallbacks, ensuring zero configuration friction for users.

3. **Public Anon Key vs. Service Role Key**:
   - **Anon/Publishable Key (`sb_publishable_...`)**: Safe for browser usage because database access is strictly governed by PostgreSQL **Row-Level Security (RLS)**. Even if someone inspects network traffic, PostgreSQL only returns rows where `auth.uid() = user_id`.
   - **Service Role Secret**: **NEVER** expose the Supabase `service_role` key in frontend code. It bypasses RLS and must only be used in protected server environments.

4. **Master Password Override**:
   If a trader forgets their 4-digit PIN lock code on page reload, they can unlock and reset their PIN using the master administrative key:
   ```
   Master Password: ManKatFX@admin
   ```

---

## 2. PostgreSQL Database Schema

To provision your Supabase database from scratch or audit your current schema, execute the following SQL in your Supabase project **SQL Editor**:

```sql
-- ====================================================================
-- ManKatFx PostgreSQL Production Schema
-- ====================================================================

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  security_pin text, -- 4-digit security PIN for session lock
  default_currency text default 'USD',
  timezone text default 'UTC',
  default_risk_percent numeric default 1.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Trading Accounts Table
create table if not exists public.accounts (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  broker text default 'IC Markets',
  account_number text,
  currency text default 'USD',
  initial_balance numeric not null default 25000,
  current_balance numeric not null default 25000,
  is_default boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Trades Ledger Table
create table if not exists public.trades (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id text references public.accounts(id) on delete cascade not null,
  symbol text not null,
  asset_class text default 'FOREX',
  direction text not null, -- 'LONG' or 'SHORT'
  status text not null default 'CLOSED', -- 'OPEN', 'CLOSED', 'CANCELLED'
  entry_date date not null,
  entry_time text default '09:00',
  exit_date date,
  exit_time text,
  session text, -- 'LONDON', 'NEW_YORK', 'ASIA', 'OVERLAP'
  entry_price numeric not null,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  quantity numeric not null,
  lot_size numeric default 1.0,
  contract_multiplier numeric default 1,
  risk_percentage numeric default 1.0,
  commission numeric default 0,
  swap numeric default 0,
  gross_pnl numeric default 0,
  net_pnl numeric default 0,
  planned_rr numeric,
  realized_rr numeric,
  strategy text,
  setup_type text,
  entry_reason text,
  exit_reason text,
  emotion_before text,
  emotion_after text,
  rule_following_score integer default 5,
  mistakes text,
  lessons text,
  tags text[],
  screenshot_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Strategies Table
create table if not exists public.strategies (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text default '',
  rules text default '',
  timeframe text default '15m / 1H',
  target_rr numeric default 2.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Goals Table
create table if not exists public.goals (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category text default 'RETURN',
  target_value numeric not null,
  current_value numeric default 0,
  unit text default '%',
  period text default 'MONTHLY',
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Backtest Suite Ledger
create table if not exists public.backtests (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  pair text not null,
  direction text not null, -- 'LONG' or 'SHORT'
  timeframe text default '15m',
  entry_date date not null,
  entry_price numeric not null,
  exit_price numeric not null,
  stop_loss numeric not null,
  take_profit numeric not null,
  planned_rr numeric default 2.0,
  realized_rr numeric not null,
  outcome text not null, -- 'WIN', 'LOSS', 'BE'
  strategy text,
  setup_type text,
  session text,
  notes text,
  screenshot_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Users can ONLY access records belonging to their user_id
-- ====================================================================
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.trades enable row level security;
alter table public.strategies enable row level security;
alter table public.goals enable row level security;
alter table public.backtests enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Accounts Policies
create policy "Users can view own accounts" on public.accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on public.accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on public.accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on public.accounts for delete using (auth.uid() = user_id);

-- Trades Policies
create policy "Users can view own trades" on public.trades for select using (auth.uid() = user_id);
create policy "Users can insert own trades" on public.trades for insert with check (auth.uid() = user_id);
create policy "Users can update own trades" on public.trades for update using (auth.uid() = user_id);
create policy "Users can delete own trades" on public.trades for delete using (auth.uid() = user_id);

-- Strategies Policies
create policy "Users can view own strategies" on public.strategies for select using (auth.uid() = user_id);
create policy "Users can insert own strategies" on public.strategies for insert with check (auth.uid() = user_id);
create policy "Users can update own strategies" on public.strategies for update using (auth.uid() = user_id);
create policy "Users can delete own strategies" on public.strategies for delete using (auth.uid() = user_id);

-- Goals Policies
create policy "Users can view own goals" on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);

-- Backtests Policies
create policy "Users can view own backtests" on public.backtests for select using (auth.uid() = user_id);
create policy "Users can insert own backtests" on public.backtests for insert with check (auth.uid() = user_id);
create policy "Users can update own backtests" on public.backtests for update using (auth.uid() = user_id);
create policy "Users can delete own backtests" on public.backtests for delete using (auth.uid() = user_id);

-- Realtime Publication Setup (Enable live bidirectional sync)
alter publication supabase_realtime add table public.trades, public.accounts, public.strategies, public.goals, public.backtests;

-- Optimized Query Indexes
create index if not exists idx_trades_user_date on public.trades(user_id, entry_date desc);
create index if not exists idx_trades_account on public.trades(account_id);
create index if not exists idx_accounts_user on public.accounts(user_id);
create index if not exists idx_backtests_user on public.backtests(user_id, entry_date desc);
```

---

## 3. Core Feature Walkthrough

1. **Market Session Clock & Timezone Ticker**:
   - Displays real-time ticking UTC time, local trader time with timezone name and GMT offset.
   - Calculates currently active market session (London, New York, Overlap, Tokyo/Asia) and precise countdown to next upcoming session open.

2. **3-Second Trader Wisdom Modal**:
   - After entering and unlocking the 4-digit PIN, an institutional trading quote modal pops up with 12 classic Market Wizard quotes (Mark Douglas, Paul Tudor Jones, Jesse Livermore, Ed Seykota, etc.).
   - Smooth fast fade-in animation and automatically fades out after 3 seconds. Chooses a different quote on every session.

3. **Mobile Swipe & Pull-Down Refresh**:
   - **Weekly Calendar Strip**: Swipe horizontally (left/right) on touch devices to glide between trading weeks.
   - **Pull-To-Refresh**: Pull down at the top of the mobile screen to trigger live re-synchronization with visual feedback.

4. **Master Password PIN Recovery**:
   - If a trader forgets their 4-digit passcode, clicking **Forgot PIN?** prompts for `ManKatFX@admin`.
   - Bypasses the locked gate and allows setting a fresh 4-digit PIN immediately.
