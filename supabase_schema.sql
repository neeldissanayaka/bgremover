-- ============================================================================
-- bgremover.art - Supabase Database Schema & Multi-Pool User Sync Migration
-- ============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor
-- This sets up the 'profiles' table with multi-tier credit pools,
-- 'credit_transactions' for webhook idempotency, Row Level Security (RLS) policies,
-- and the 3-tier atomic 'deduct_credit' stored procedure.
-- ============================================================================

-- 1. Create public.profiles table linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 5,
  daily_free_credits INTEGER DEFAULT 5,
  paid_credits INTEGER DEFAULT 0,
  plan_credits INTEGER DEFAULT 0,
  pro_expires_at TIMESTAMPTZ,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Create public.credit_transactions table for Payment Idempotency & Audit
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL, -- Prevents duplicate webhook event crediting
  event_name TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  credits_granted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON public.credit_transactions(order_id);

-- 3. Enable Row Level Security (RLS) across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for public.profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. RLS Policies for public.credit_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Automated PostgreSQL Trigger Function for New User Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    avatar_url,
    plan,
    credits,
    daily_free_credits,
    paid_credits,
    plan_credits,
    is_pro,
    last_reset_date,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email
    ),
    'free',
    5,
    5,
    0,
    0,
    FALSE,
    CURRENT_DATE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$;

-- Attach Trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. Multi-Tier Atomic Credit Deduction RPC Function (3-Tier Priority)
-- ============================================================================
-- Priority 0: Active Unlimited Pass -> 0 credits consumed.
-- Priority 1: daily_free_credits > 0 -> decrement daily_free_credits.
-- Priority 2: Active plan_credits > 0 -> decrement plan_credits.
-- Priority 3: Non-expiring paid_credits > 0 -> decrement paid_credits.
-- If all are 0: Raises 'Insufficient credits' exception.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.deduct_credit(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_today DATE := CURRENT_DATE;
  v_daily INT;
  v_plan_cr INT;
  v_paid INT;
  v_sub_active BOOLEAN;
  v_total INT;
BEGIN
  -- Lock the row for atomic deduction
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 0. Check Unlimited Pass bypass
  IF v_profile.is_pro AND v_profile.plan = 'unlimited' AND (v_profile.pro_expires_at IS NULL OR v_profile.pro_expires_at > NOW()) THEN
    RETURN jsonb_build_object(
      'credits', 9999,
      'daily_free_credits', v_profile.daily_free_credits,
      'plan_credits', v_profile.plan_credits,
      'paid_credits', v_profile.paid_credits
    );
  END IF;

  v_daily := COALESCE(v_profile.daily_free_credits, 5);
  v_plan_cr := COALESCE(v_profile.plan_credits, 0);
  v_paid := COALESCE(v_profile.paid_credits, 0);

  -- Check if midnight reset is required
  IF v_profile.last_reset_date IS NULL OR v_profile.last_reset_date < v_today THEN
    v_daily := 5;
  END IF;

  -- Check subscription expiration status
  v_sub_active := v_profile.is_pro AND (v_profile.pro_expires_at IS NULL OR v_profile.pro_expires_at > NOW());
  IF NOT v_sub_active THEN
    v_plan_cr := 0;
  END IF;

  -- 3-Tier Priority Deduction
  IF v_daily > 0 THEN
    -- Priority 1: Daily Free Credits
    v_daily := v_daily - 1;
  ELSIF v_sub_active AND v_plan_cr > 0 THEN
    -- Priority 2: Subscription Monthly Quota
    v_plan_cr := v_plan_cr - 1;
  ELSIF v_paid > 0 THEN
    -- Priority 3: Non-expiring Paid Credits (PAYG)
    v_paid := v_paid - 1;
  ELSE
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  v_total := v_daily + v_plan_cr + v_paid;

  -- Update database state atomically
  UPDATE public.profiles
  SET daily_free_credits = v_daily,
      plan_credits = v_plan_cr,
      paid_credits = v_paid,
      credits = v_total,
      last_reset_date = v_today,
      updated_at = NOW()
  WHERE id = user_id;

  RETURN jsonb_build_object(
    'credits', v_total,
    'daily_free_credits', v_daily,
    'plan_credits', v_plan_cr,
    'paid_credits', v_paid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.deduct_credit(UUID) TO authenticated, anon, service_role;

-- ============================================================================
-- 8. Optional: Table for processed image logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.image_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  original_size INTEGER,
  processed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.image_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own image history" ON public.image_history;
CREATE POLICY "Users can view own image history"
  ON public.image_history
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own image history" ON public.image_history;
CREATE POLICY "Users can insert own image history"
  ON public.image_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
