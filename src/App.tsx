import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ImageEditor } from './components/ImageEditor';
import { HowItWorks } from './components/HowItWorks';
import { PassportSection } from './components/PassportSection';
import { FeaturesSection } from './components/FeaturesSection';
import { ComparisonTable } from './components/ComparisonTable';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { DailyLimitModal } from './components/DailyLimitModal';
import { UrlUploadModal } from './components/UrlUploadModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { LegalModal, LegalModalType } from './components/LegalModal';
import { SAMPLE_IMAGES } from './data/samples';
import { ProcessedImage, SampleImage, UserProfile } from './types';
import { getDailyLimitStatus, incrementDailyLimit, syncDeviceDailyUsed, recordDeviceFreeCreditUsed } from './utils/dailyLimit';
import { getCurrentUser, logoutUser, subscribeToAuthChanges, saveCurrentUser, deductUserCredit } from './utils/auth';
import { supabase, isSupabaseConfigured } from './utils/supabase';
import { processBackgroundRemoval } from './utils/imageProcessing';
import { sanitizeFileName } from './utils/security';
import { getPlanName, redirectToLemonSqueezyCheckout } from './utils/lemonsqueezy';

export default function App() {
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [progressStep, setProgressStep] = useState<string>('Preparing...');
  
  // User Auth & Subscription State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [pricingAlertMessage, setPricingAlertMessage] = useState<string | null>(null);
  const [pendingCheckoutPlan, setPendingCheckoutPlan] = useState<string | null>(null);

  // Daily Quota state
  const [dailyQuota, setDailyQuota] = useState(getDailyLimitStatus());
  const [isLimitModalOpen, setIsLimitModalOpen] = useState<boolean>(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);

  // Legal Modal (Privacy Policy & Terms of Service) State
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalModalType>('privacy');

  const refreshQuota = useCallback(async () => {
    try {
      const response = await fetch('/api/guest-credit', { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        const quota = await response.json();
        if (typeof quota.used === 'number') {
          syncDeviceDailyUsed(Number(quota.used));
        }
      }
    } catch (error) {
      console.warn('[Guest Quota Status Error]', error);
    }

    const currentUsr = getCurrentUser();
    if (currentUsr) {
      setCurrentUser(currentUsr);
    }
    setDailyQuota(getDailyLimitStatus());
  }, []);

  useEffect(() => {
    void refreshQuota();
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });

    // Support Clean URL Routing & Deep Linking (#privacy, #terms, #pricing, #signin, #signup)
    const handleHashRouting = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#privacy' || hash === '#privacy-policy') {
        setLegalModalTab('privacy');
        setIsLegalModalOpen(true);
      } else if (hash === '#terms' || hash === '#terms-of-service' || hash === '#tos') {
        setLegalModalTab('terms');
        setIsLegalModalOpen(true);
      } else if (hash === '#pricing' || hash === '#plans') {
        setIsPricingModalOpen(true);
      } else if (hash === '#signin' || hash === '#login') {
        setAuthModalMode('signin');
        setIsAuthModalOpen(true);
      } else if (hash === '#signup' || hash === '#register') {
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
      }
    };

    // Handle any OAuth error parameters safely and sanitize address bar
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
    const errorCode = searchParams.get('error_code') || hashParams.get('error_code');

    if (errorDesc || errorCode) {
      console.warn('[Auth Redirect Notice]:', errorDesc || errorCode);
      // Clean ugly error query and hash from browser address bar immediately
      window.history.replaceState(null, document.title, window.location.pathname);
    } else if (window.location.search) {
      const cleanUrl = window.location.pathname + (window.location.hash || '');
      window.history.replaceState(null, document.title, cleanUrl);
    }

    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);

    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', handleHashRouting);
    };
  }, [refreshQuota]);

  const cleanUrlPath = () => {
    if (window.location.hash) {
      window.history.replaceState(null, document.title, window.location.pathname);
    }
  };

  const handleOpenLegal = (tab: LegalModalType = 'privacy') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
    window.history.pushState(null, '', `#${tab}`);
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setPendingCheckoutPlan(null);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
    window.history.pushState(null, '', `#${mode}`);
  };

  const handleRequireAuthFromPricing = (planId: string) => {
    setPendingCheckoutPlan(planId);
    setIsPricingModalOpen(false);
    setPricingAlertMessage(null);
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
    window.history.pushState(null, '', '#signin');
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    cleanUrlPath();
    if (pendingCheckoutPlan) {
      const planToRedirect = pendingCheckoutPlan;
      setPendingCheckoutPlan(null);
      setIsAuthModalOpen(false);
      // Auto-forward seamlessly to Lemon Squeezy checkout with newly authenticated user context
      setTimeout(() => {
        redirectToLemonSqueezyCheckout(planToRedirect, user);
      }, 200);
    }
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingCheckoutPlan(null);
    cleanUrlPath();
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleUpgradeSuccess = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    setPricingAlertMessage(null);
    cleanUrlPath();
  };

  const openPricingModal = (alertMsg?: string | null) => {
    setPricingAlertMessage(alertMsg || null);
    setIsPricingModalOpen(true);
    window.history.pushState(null, '', '#pricing');
  };

  const closePricingModal = () => {
    setPricingAlertMessage(null);
    setIsPricingModalOpen(false);
    cleanUrlPath();
  };

  // Credit enforcement for signed-in users is server/database authoritative.
  // Never trust isPro, plan or credit values stored in the browser.
  const checkAndDeductCredit = async (): Promise<boolean> => {
    if (currentUser) {
      try {
        const { user: updatedUser } = await deductUserCredit(currentUser);
        setCurrentUser(updatedUser);
        setDailyQuota(getDailyLimitStatus());
        return true;
      } catch (err) {
        console.error('[Credit Deduction Error]', err);
        openPricingModal("You've used all your credits. Buy more credits or upgrade to continue.");
        return false;
      }
    }

    // Guest quota is enforced by a serverless API + database. localStorage is UI-only.
    try {
      const response = await fetch('/api/guest-credit', { method: 'POST' });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (response.status === 429 || body?.allowed === false) {
          recordDeviceFreeCreditUsed();
          setDailyQuota({ used: 3, remaining: 0, total: 3, isLimitReached: true, date: new Date().toISOString().slice(0,10) });
          openPricingModal("You've used all 3 free credits for today. Sign in, buy credits, or upgrade to continue.");
          setIsLimitModalOpen(true);
        } else {
          console.error('[Guest Quota API Error]', body);
          openPricingModal(body?.error || 'Usage verification is temporarily unavailable. Please try again.');
        }
        return false;
      }
      const quota = await response.json();
      recordDeviceFreeCreditUsed();
      if (typeof quota.used === 'number') {
        syncDeviceDailyUsed(quota.used);
      }
      setDailyQuota(getDailyLimitStatus());
      return true;
    } catch (err) {
      console.error('[Guest Quota Error]', err);
      // Fail closed: quota-service failure must not grant free processing.
      openPricingModal('Usage verification is temporarily unavailable. Please try again.');
      return false;
    }
  };

  // Handle uploaded file
  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setProgressPct(10);
    setProgressStep('Reading file data...');

    try {
      const originalUrl = URL.createObjectURL(file);

      const result = await processBackgroundRemoval(file, (pct, step) => {
        setProgressPct(pct);
        setProgressStep(step);
      });

      const safeFileName = sanitizeFileName(file.name);

      // Charge only after successful processing so failed AI jobs do not consume a credit.
      const isAllowed = await checkAndDeductCredit();
      if (!isAllowed) {
        URL.revokeObjectURL(originalUrl);
        return;
      }

      const newProcessed: ProcessedImage = {
        id: 'img_' + Date.now(),
        originalUrl,
        transparentUrl: result.transparentUrl,
        fileName: safeFileName,
        originalSize: file.size,
        width: result.width,
        height: result.height,
        processedAt: new Date(),
      };

      setProcessedImage(newProcessed);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to remove background:', err);
      alert('Failed to remove image background. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sample thumbnail click
  const handleSampleSelected = async (sample: SampleImage) => {
    setIsProcessing(true);
    setProgressPct(20);
    setProgressStep(`Loading sample: ${sample.title}...`);

    try {
      const result = await processBackgroundRemoval(sample.originalUrl, (pct, step) => {
        setProgressPct(pct);
        setProgressStep(step);
      });

      // Charge only after successful processing.
      const isAllowed = await checkAndDeductCredit();
      if (!isAllowed) return;

      const newProcessed: ProcessedImage = {
        id: 'sample_' + sample.id + '_' + Date.now(),
        originalUrl: sample.originalUrl,
        transparentUrl: result.transparentUrl || sample.transparentUrl,
        fileName: `${sample.title.toLowerCase().replace(/\s+/g, '_')}.png`,
        originalSize: 1024 * 500,
        width: result.width || sample.width,
        height: result.height || sample.height,
        processedAt: new Date(),
      };

      setProcessedImage(newProcessed);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.warn('Sample processing fallback:', err);
      setProcessedImage({
        id: 'sample_' + sample.id,
        originalUrl: sample.originalUrl,
        transparentUrl: sample.transparentUrl,
        fileName: `${sample.title}.png`,
        originalSize: 1024 * 500,
        width: sample.width,
        height: sample.height,
        processedAt: new Date(),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle URL import
  const handleUrlSubmit = async (url: string) => {
    setIsProcessing(true);
    setProgressPct(15);
    setProgressStep('Fetching image from link...');

    try {
      const result = await processBackgroundRemoval(url, (pct, step) => {
        setProgressPct(pct);
        setProgressStep(step);
      });

      // Charge only after successful processing.
      const isAllowed = await checkAndDeductCredit();
      if (!isAllowed) return;

      const newProcessed: ProcessedImage = {
        id: 'url_' + Date.now(),
        originalUrl: url,
        transparentUrl: result.transparentUrl,
        fileName: 'imported_image.png',
        originalSize: 1024 * 400,
        width: result.width,
        height: result.height,
        processedAt: new Date(),
      };

      setProcessedImage(newProcessed);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('URL processing failed:', err);
      alert('Could not download or process image from this URL. Please verify the link allows cross-origin requests or upload a file directly.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-x-hidden">
      
      {/* User-Focused Navigation Bar */}
      <Navbar
        remainingQuota={dailyQuota.remaining}
        totalQuota={dailyQuota.total}
        onQuotaReset={refreshQuota}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenPricing={() => openPricingModal(null)}
        onOpenLegal={handleOpenLegal}
        onLogout={handleLogout}
      />

      {/* Main Tool Area */}
      <main className="flex-grow">
        {processedImage ? (
          <ImageEditor
            processedImage={processedImage}
            onReset={() => setProcessedImage(null)}
            onUploadNew={() => setProcessedImage(null)}
            onLimitExceeded={() => setIsLimitModalOpen(true)}
            currentUser={currentUser}
            onOpenPricing={() => openPricingModal(null)}
          />
        ) : (
          <HeroSection
            onFileSelected={handleFileSelected}
            onSampleSelected={handleSampleSelected}
            onOpenUrlModal={() => setIsUrlModalOpen(true)}
            isProcessing={isProcessing}
            progressPct={progressPct}
            progressStep={progressStep}
          />
        )}

        {/* Informative & High-Converting Sections */}
        <HowItWorks />
        <PassportSection />
        <FeaturesSection />
        <ComparisonTable />
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenPricing={() => openPricingModal(null)}
        onOpenAuth={() => handleOpenAuth('signup')}
        onOpenLegal={handleOpenLegal}
      />

      {/* User Authentication Modal (Google / Email) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        initialMode={authModalMode}
        pendingPlanName={pendingCheckoutPlan ? getPlanName(pendingCheckoutPlan) : null}
        onSuccess={handleAuthSuccess}
        onOpenLegal={handleOpenLegal}
      />

      {/* Lemon Squeezy Pricing & Pro Upgrade Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={closePricingModal}
        currentUser={currentUser}
        onRequireAuth={handleRequireAuthFromPricing}
        onUpgradeSuccess={handleUpgradeSuccess}
        alertMessage={pricingAlertMessage}
        onOpenLegal={handleOpenLegal}
      />

      {/* Privacy Policy & Terms of Service Legal Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => {
          setIsLegalModalOpen(false);
          cleanUrlPath();
        }}
        initialTab={legalModalTab}
        onOpenPricing={() => {
          setIsLegalModalOpen(false);
          openPricingModal(null);
        }}
      />

      {/* Daily Quota Reached Modal */}
      <DailyLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        onOpenPricing={() => openPricingModal(null)}
      />

      {/* Paste URL Modal */}
      <UrlUploadModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onSubmitUrl={handleUrlSubmit}
      />

    </div>
  );
}
