// bgremover.art - Client Engine & Lemon Squeezy 4-Tier Integration
(function () {
  const STORAGE_KEY = 'bgremover_daily_limit_v1';
  const AUTH_STORAGE_KEY = 'bgremover_user_v1';
  const MAX_LIMIT = 5;

  function getQuota() {
    const today = new Date().toISOString().split('T')[0];
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (data.date !== today) {
        return { count: 0, remaining: MAX_LIMIT, date: today };
      }
      return {
        count: data.count || 0,
        remaining: Math.max(0, MAX_LIMIT - (data.count || 0)),
        date: today,
      };
    } catch {
      return { count: 0, remaining: MAX_LIMIT, date: today };
    }
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function updateUI() {
    const user = getUser();
    const quota = getQuota();
    const countEl = document.getElementById('quotaCount');
    const badgeEl = document.getElementById('quotaBadge');
    const authContainer = document.getElementById('authContainer');

    if (user && user.isPro) {
      if (badgeEl) {
        badgeEl.className = 'bg-amber-50 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-bold border border-amber-200/80 flex items-center gap-1';
        badgeEl.innerHTML = '<span class="font-extrabold tracking-wide">👑 PRO UNLIMITED</span>';
      }
    } else if (countEl) {
      countEl.innerText = `${quota.remaining}/${MAX_LIMIT}`;
    }

    if (authContainer) {
      if (user) {
        authContainer.innerHTML = `
          <div class="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-200 bg-white">
            <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(user.email)}" class="w-7 h-7 rounded-full bg-slate-100" />
            <span class="text-xs font-bold text-slate-800">${user.name || user.email.split('@')[0]}</span>
          </div>
        `;
      } else {
        authContainer.innerHTML = `
          <button onclick="window.location.href='#pricing'" class="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer">
            Sign In / Upgrade
          </button>
        `;
      }
    }
  }

  // Update Pay-as-you-go dropdown price
  window.updatePaygPrice = function () {
    const select = document.getElementById('paygSelect');
    const priceDisplay = document.getElementById('paygPriceDisplay');
    if (select && priceDisplay) {
      const [_, price] = select.value.split('|');
      priceDisplay.innerText = `$${price}`;
    }
  };

  // Dynamic Lemon Squeezy checkout handler for PAYG
  window.handleCheckoutPayg = function () {
    const select = document.getElementById('paygSelect');
    if (!select) return;
    const [planId] = select.value.split('|');
    window.handleCheckout(planId);
  };

  // General checkout handler passing user context
  window.handleCheckout = function (planId) {
    const user = getUser();
    const userEmail = user?.email || 'customer@bgremover.art';
    const userId = user?.id || 'usr_guest';

    // Check if custom Lemon Squeezy checkout URL is configured
    let customUrls = {};
    try {
      const rawConfig = localStorage.getItem('bgremover_lemonsqueezy_config_v1');
      if (rawConfig) customUrls = JSON.parse(rawConfig);
    } catch (e) {}

    const defaultCheckoutUrls = {
      payg_3: customUrls.payg3Url || 'https://bgremover.lemonsqueezy.com/buy/credit-pack-3',
      payg_10: customUrls.payg10Url || 'https://bgremover.lemonsqueezy.com/buy/credit-pack-10',
      payg_50: customUrls.payg50Url || 'https://bgremover.lemonsqueezy.com/buy/credit-pack-50',
      lite_monthly: customUrls.liteUrl || 'https://bgremover.lemonsqueezy.com/buy/lite-monthly',
      pro_monthly: customUrls.proUrl || 'https://bgremover.lemonsqueezy.com/buy/pro-monthly',
      unlimited_monthly: customUrls.unlimitedUrl || 'https://bgremover.lemonsqueezy.com/buy/unlimited-monthly',
    };

    const checkoutUrl = defaultCheckoutUrls[planId] || defaultCheckoutUrls.pro_monthly;

    try {
      const targetUrl = new URL(checkoutUrl);
      if (userEmail) {
        targetUrl.searchParams.set('checkout[email]', userEmail);
      }
      targetUrl.searchParams.set('checkout[custom][user_id]', userId);
      targetUrl.searchParams.set('checkout[custom][plan_id]', planId);
      targetUrl.searchParams.set('media', '0');
      targetUrl.searchParams.set('logo', '1');

      // Full-page redirect directly to Lemon Squeezy hosted checkout
      window.location.href = targetUrl.toString();
    } catch (err) {
      window.location.href = checkoutUrl;
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    updateUI();

    if (window.LemonSqueezy) {
      window.LemonSqueezy.Setup?.({
        eventHandler: (event) => {
          if (event.event === 'Checkout.Success' || event.event === 'Payment.Success') {
            console.log('Subscription or credit pack order completed successfully');
            const currentUser = getUser() || {
              id: 'usr_' + Math.random().toString(36).substring(2, 9),
              email: 'customer@bgremover.art',
              name: 'Pro Member',
              plan: 'pro',
              isPro: true,
              credits: 9999,
            };
            currentUser.isPro = true;
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
            updateUI();
          }
        },
      });
    }
  });
})();
