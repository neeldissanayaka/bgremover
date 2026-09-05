import { DailyLimitData } from '../types';

export const MAX_FREE_DAILY = 3;
const DEVICE_USAGE_KEY = 'bgremover_device_free_usage_v2';
const LEGACY_GUEST_KEY = 'bgremover_daily_limit_v1';
const AUTH_STORAGE_KEY = 'bgremover_user_v1';

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DeviceUsageRecord {
  date: string;
  used: number;
}

/**
 * Returns how many free credits have been consumed on this browser/device today (0 to 3).
 * Automatically resets to 0 when the date rolls over at midnight.
 */
export function getDeviceFreeCreditsUsedToday(): number {
  try {
    const today = getTodayString();
    const raw = localStorage.getItem(DEVICE_USAGE_KEY);
    if (raw) {
      const parsed: DeviceUsageRecord = JSON.parse(raw);
      if (parsed.date === today) {
        return Math.min(MAX_FREE_DAILY, Math.max(0, Number(parsed.used) || 0));
      }
    }

    // Check if legacy guest key has usage for today
    const legacyRaw = localStorage.getItem(LEGACY_GUEST_KEY);
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw);
      if (parsedLegacy.date === today && typeof parsedLegacy.count === 'number') {
        const legacyUsed = Math.min(MAX_FREE_DAILY, Math.max(0, parsedLegacy.count));
        saveDeviceDailyUsed(legacyUsed);
        return legacyUsed;
      }
    }

    // New day or first run: initialize with 0 used
    saveDeviceDailyUsed(0);
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Saves the current device's daily used count.
 */
export function saveDeviceDailyUsed(used: number): void {
  try {
    const today = getTodayString();
    const record: DeviceUsageRecord = {
      date: today,
      used: Math.min(MAX_FREE_DAILY, Math.max(0, used)),
    };
    localStorage.setItem(DEVICE_USAGE_KEY, JSON.stringify(record));
    
    // Also update legacy format so older components/caches remain synchronized
    const legacyData: DailyLimitData = {
      date: today,
      count: record.used,
      maxLimit: MAX_FREE_DAILY,
    };
    localStorage.setItem(LEGACY_GUEST_KEY, JSON.stringify(legacyData));
  } catch (err) {
    console.warn('[Quota] Could not save device usage:', err);
  }
}

/**
 * Records consumption of 1 daily free credit across both guest & logged-in free sessions.
 * Returns the new used count (max 3).
 */
export function recordDeviceFreeCreditUsed(): number {
  const currentUsed = getDeviceFreeCreditsUsedToday();
  const nextUsed = Math.min(MAX_FREE_DAILY, currentUsed + 1);
  saveDeviceDailyUsed(nextUsed);
  return nextUsed;
}

/**
 * Syncs the local device usage with authoritative server-side usage if server reports higher.
 */
export function syncDeviceDailyUsed(serverUsed: number): void {
  if (typeof serverUsed === 'number' && !isNaN(serverUsed)) {
    const localUsed = getDeviceFreeCreditsUsedToday();
    if (serverUsed > localUsed) {
      saveDeviceDailyUsed(serverUsed);
    }
  }
}

/**
 * Reads user auth state safely without circular dependencies.
 */
function getStoredUserFast(): { isPro?: boolean; plan?: string; credits?: number; dailyFreeCredits?: number } | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getDailyLimitStatus(): {
  used: number;
  remaining: number;
  total: number;
  isLimitReached: boolean;
  date: string;
} {
  const today = getTodayString();
  const user = getStoredUserFast();

  // If user is an active Pro or VIP subscriber with unlimited plan
  if (user && user.isPro && user.plan === 'unlimited') {
    return {
      used: 0,
      remaining: 9999,
      total: 9999,
      isLimitReached: false,
      date: today,
    };
  }

  // If user has paid credits (PAYG pack or monthly plan)
  if (user && typeof user.credits === 'number' && (user.plan !== 'free' || user.isPro)) {
    return {
      used: 0,
      remaining: user.credits,
      total: Math.max(user.credits, MAX_FREE_DAILY),
      isLimitReached: user.credits <= 0,
      date: today,
    };
  }

  const used = getDeviceFreeCreditsUsedToday();
  const remaining = Math.max(0, MAX_FREE_DAILY - used);

  return {
    used,
    remaining,
    total: MAX_FREE_DAILY,
    isLimitReached: remaining <= 0,
    date: today,
  };
}

export function incrementDailyLimit(): {
  used: number;
  remaining: number;
  isLimitReached: boolean;
} {
  const user = getStoredUserFast();
  if (user && user.isPro && user.plan === 'unlimited') {
    return {
      used: 0,
      remaining: 9999,
      isLimitReached: false,
    };
  }

  const newUsed = recordDeviceFreeCreditUsed();
  return {
    used: newUsed,
    remaining: Math.max(0, MAX_FREE_DAILY - newUsed),
    isLimitReached: newUsed >= MAX_FREE_DAILY,
  };
}
