import { DailyLimitData } from '../types';
import { getCurrentUser } from './auth';

const GUEST_STORAGE_KEY = 'bgremover_daily_limit_v1';
const USER_QUOTA_PREFIX = 'bgremover_user_quota_';
const MAX_FREE_DAILY = 3;

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStorageKeyForCurrentSubject(): string {
  const user = getCurrentUser();
  if (user && user.id) {
    return `${USER_QUOTA_PREFIX}${user.id}`;
  }
  return GUEST_STORAGE_KEY;
}

export function getDailyLimitStatus(overrideUserId?: string): {
  used: number;
  remaining: number;
  total: number;
  isLimitReached: boolean;
  date: string;
} {
  const today = getTodayString();
  const user = getCurrentUser();

  // If user is an active Pro or VIP subscriber, they have unlimited / paid credits
  if (user && user.isPro) {
    return {
      used: 0,
      remaining: 9999,
      total: 9999,
      isLimitReached: false,
      date: today,
    };
  }

  const storageKey = overrideUserId ? `${USER_QUOTA_PREFIX}${overrideUserId}` : getStorageKeyForCurrentSubject();

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {
        used: 0,
        remaining: MAX_FREE_DAILY,
        total: MAX_FREE_DAILY,
        isLimitReached: false,
        date: today,
      };
    }

    const data: DailyLimitData = JSON.parse(raw);
    if (data.date !== today) {
      // New day, auto-reset counter to 3 free per 24 hours
      const freshData: DailyLimitData = {
        date: today,
        count: 0,
        maxLimit: MAX_FREE_DAILY,
      };
      localStorage.setItem(storageKey, JSON.stringify(freshData));
      return {
        used: 0,
        remaining: MAX_FREE_DAILY,
        total: MAX_FREE_DAILY,
        isLimitReached: false,
        date: today,
      };
    }

    const count = data.count || 0;
    const remaining = Math.max(0, MAX_FREE_DAILY - count);
    return {
      used: count,
      remaining,
      total: MAX_FREE_DAILY,
      isLimitReached: remaining <= 0,
      date: today,
    };
  } catch {
    return {
      used: 0,
      remaining: MAX_FREE_DAILY,
      total: MAX_FREE_DAILY,
      isLimitReached: false,
      date: today,
    };
  }
}

export function incrementDailyLimit(): {
  used: number;
  remaining: number;
  isLimitReached: boolean;
} {
  const user = getCurrentUser();
  if (user && user.isPro) {
    return {
      used: 0,
      remaining: 9999,
      isLimitReached: false,
    };
  }

  const today = getTodayString();
  const current = getDailyLimitStatus();
  const storageKey = getStorageKeyForCurrentSubject();
  
  const newCount = current.used + 1;
  const data: DailyLimitData = {
    date: today,
    count: newCount,
    maxLimit: MAX_FREE_DAILY,
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }

  return {
    used: newCount,
    remaining: Math.max(0, MAX_FREE_DAILY - newCount),
    isLimitReached: newCount >= MAX_FREE_DAILY,
  };
}
