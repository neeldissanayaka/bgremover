export type BackgroundMode = 'transparent' | 'color' | 'blur' | 'customImage';

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  transparentUrl: string;
  fileName: string;
  originalSize: number;
  width: number;
  height: number;
  processedAt: Date;
}

export interface DailyLimitData {
  date: string; // YYYY-MM-DD
  count: number;
  maxLimit: number;
}

export interface SampleImage {
  id: string;
  title: string;
  category: 'portrait' | 'product' | 'vehicle' | 'pet';
  originalUrl: string;
  transparentUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export interface PassportPreset {
  id: string;
  name: string;
  country: string;
  hexColor: string;
  description: string;
}

export interface ScenicBackdrop {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  previewUrl: string;
}

export interface DownloadOptions {
  format: 'png' | 'webp';
  quality: number; // 0.1 to 1.0 for webp
  resolution: 'standard' | 'original';
}

export type PlanType = 'free' | 'payg' | 'lite' | 'pro' | 'unlimited';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: PlanType;
  credits: number; // Computed / total active credits (daily + plan + paid)
  dailyFreeCredits: number; // Defaults to 5 for ALL users (resets every midnight)
  paidCredits: number; // Non-expiring purchased credits (PAYG packs: 3, 10, 50)
  planCredits: number; // Monthly quota credits tied to active subscriptions (Lite: 40, Pro: 200)
  proExpiresAt?: string | null; // ISO timestamp
  lastResetDate?: string; // YYYY-MM-DD date string for daily reset
  isPro: boolean;
  createdAt: string;
  token?: string;
  provider?: 'google' | 'password' | 'firebase' | 'supabase' | 'custom';
  emailVerified?: boolean;
}

export type PricingTierId = 'payg_3' | 'payg_10' | 'payg_50' | 'lite_monthly' | 'pro_monthly' | 'unlimited_monthly';

export interface PricingPlan {
  id: PricingTierId;
  name: string;
  price: string;
  period?: string;
  badge?: string;
  description: string;
  features: string[];
  creditsCount?: number;
  popular?: boolean;
}

