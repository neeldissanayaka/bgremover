// bgremover.art - Lemon Squeezy Official Checkout & Overlay Integration
import { UserProfile } from '../types';

export interface LemonSqueezyConfig {
  storeId?: string;
  payg3Url?: string;
  payg10Url?: string;
  payg50Url?: string;
  liteUrl?: string;
  proUrl?: string;
  unlimitedUrl?: string;
}

// Fallback hosted URLs if environment variables are not yet populated
const DEFAULT_CHECKOUT_URLS: Record<string, string> = {
  payg_3: 'https://bgremover.lemonsqueezy.com/buy/credit-pack-3',
  payg_10: 'https://bgremover.lemonsqueezy.com/buy/credit-pack-10',
  payg_50: 'https://bgremover.lemonsqueezy.com/buy/credit-pack-50',
  lite_monthly: 'https://bgremover.lemonsqueezy.com/buy/lite-monthly',
  pro_monthly: 'https://bgremover.lemonsqueezy.com/buy/pro-monthly',
  unlimited_monthly: 'https://bgremover.lemonsqueezy.com/buy/unlimited-pass',
};

const PLAN_NAMES: Record<string, string> = {
  payg_3: '3 Credits Pack ($2.00)',
  payg_10: '10 Credits Pack ($5.00)',
  payg_50: '50 Credits Pack ($15.00)',
  lite_monthly: 'Lite Plan ($4.99 / month)',
  pro_monthly: 'Pro Plan ($20.00 / month)',
  unlimited_monthly: 'Unlimited Pass ($300 / year)',
};

export function getPlanName(planId: string): string {
  return PLAN_NAMES[planId] || 'Subscription Plan';
}

// Retrieve environment configured store URLs
export function getLemonSqueezyConfig(): LemonSqueezyConfig {
  return {
    storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || '',
    payg3Url: import.meta.env.VITE_LEMONSQUEEZY_PAYG_3_URL || DEFAULT_CHECKOUT_URLS.payg_3,
    payg10Url: import.meta.env.VITE_LEMONSQUEEZY_PAYG_10_URL || DEFAULT_CHECKOUT_URLS.payg_10,
    payg50Url: import.meta.env.VITE_LEMONSQUEEZY_PAYG_50_URL || DEFAULT_CHECKOUT_URLS.payg_50,
    liteUrl: import.meta.env.VITE_LEMONSQUEEZY_LITE_URL || DEFAULT_CHECKOUT_URLS.lite_monthly,
    proUrl: import.meta.env.VITE_LEMONSQUEEZY_PRO_URL || DEFAULT_CHECKOUT_URLS.pro_monthly,
    unlimitedUrl: import.meta.env.VITE_LEMONSQUEEZY_UNLIMITED_URL || DEFAULT_CHECKOUT_URLS.unlimited_monthly,
  };
}

/**
 * Builds the official Lemon Squeezy full-page or overlay checkout URL.
 * Passes customer email and custom user metadata for webhook identification.
 */
export function buildCheckoutUrl(
  planId: string,
  user: UserProfile | null,
  isOverlay = false
): string {
  const config = getLemonSqueezyConfig();
  const userEmail = user?.email || '';
  const userId = user?.id || '';

  let rawUrl = '';
  switch (planId) {
    case 'payg_3':
      rawUrl = config.payg3Url || DEFAULT_CHECKOUT_URLS.payg_3;
      break;
    case 'payg_10':
      rawUrl = config.payg10Url || DEFAULT_CHECKOUT_URLS.payg_10;
      break;
    case 'payg_50':
      rawUrl = config.payg50Url || DEFAULT_CHECKOUT_URLS.payg_50;
      break;
    case 'lite_monthly':
      rawUrl = config.liteUrl || DEFAULT_CHECKOUT_URLS.lite_monthly;
      break;
    case 'pro_monthly':
      rawUrl = config.proUrl || DEFAULT_CHECKOUT_URLS.pro_monthly;
      break;
    case 'unlimited_monthly':
      rawUrl = config.unlimitedUrl || DEFAULT_CHECKOUT_URLS.unlimited_monthly;
      break;
    default:
      rawUrl = config.proUrl || DEFAULT_CHECKOUT_URLS.pro_monthly;
  }

  try {
    const urlObj = new URL(rawUrl);
    if (userEmail) {
      urlObj.searchParams.set('checkout[email]', userEmail);
    }
    if (userId) {
      urlObj.searchParams.set('checkout[custom][user_id]', userId);
    }
    urlObj.searchParams.set('checkout[custom][plan_id]', planId);
    urlObj.searchParams.set('media', '0');
    urlObj.searchParams.set('logo', '1');
    if (isOverlay) {
      urlObj.searchParams.set('embed', '1');
    }
    return urlObj.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Triggers a direct full-page redirect to Lemon Squeezy checkout.
 */
export function redirectToLemonSqueezyCheckout(
  planId: string,
  user: UserProfile | null
): void {
  const checkoutUrl = buildCheckoutUrl(planId, user, false);
  if (typeof window !== 'undefined' && checkoutUrl) {
    window.location.href = checkoutUrl;
  }
}

/**
 * Initializes and binds event listeners for Lemon Squeezy Overlay and window message callbacks.
 * Automatically notifies when checkout is closed or cancelled.
 */
export function setupLemonSqueezyListeners(onCheckoutClosed: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Lemon Squeezy JS Setup callback if loaded via script
  if ((window as any).LemonSqueezy?.Setup) {
    try {
      (window as any).LemonSqueezy.Setup({
        eventHandler: (event: { event: string; data?: any }) => {
          if (
            event.event === 'Checkout.Closed' ||
            event.event === 'Checkout.Cancelled' ||
            event.event === 'Payment.Failed'
          ) {
            onCheckoutClosed();
          }
        },
      });
    } catch (e) {
      console.warn('[LemonSqueezy] Setup listener warning:', e);
    }
  }

  // 2. Global postMessage listener for cross-origin checkout events
  const handleMessage = (event: MessageEvent) => {
    try {
      if (typeof event.data === 'string' && event.data.includes('lemon_squeezy')) {
        const parsed = JSON.parse(event.data);
        if (
          parsed.event === 'Checkout.Closed' ||
          parsed.event === 'Checkout.Cancelled' ||
          parsed.name === 'checkout:closed'
        ) {
          onCheckoutClosed();
        }
      } else if (event.data?.event === 'Checkout.Closed' || event.data?.event === 'Checkout.Cancelled') {
        onCheckoutClosed();
      }
    } catch {
      // Ignore unparseable non-JSON messages
    }
  };

  window.addEventListener('message', handleMessage);

  return () => {
    window.removeEventListener('message', handleMessage);
  };
}
