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
import { SAMPLE_IMAGES } from './data/samples';
import { ProcessedImage, SampleImage, UserProfile } from './types';
import { getDailyLimitStatus, incrementDailyLimit } from './utils/dailyLimit';
import { getCurrentUser, logoutUser, subscribeToAuthChanges, saveCurrentUser, deductUserCredit } from './utils/auth';
import { supabase, isSupabaseConfigured } from './utils/supabase';
import { processBackgroundRemoval } from './utils/imageProcessing';
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

  const refreshQuota = useCallback(() => {
    setDailyQuota(getDailyLimitStatus());
  }, []);

  useEffect(() => {
    refreshQuota();
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [refreshQuota]);

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setPendingCheckoutPlan(null);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleRequireAuthFromPricing = (planId: string) => {
    setPendingCheckoutPlan(planId);
    setIsPricingModalOpen(false);
    setPricingAlertMessage(null);
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
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
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleUpgradeSuccess = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    setPricingAlertMessage(null);
  };

  const openPricingModal = (alertMsg?: string | null) => {
    setPricingAlertMessage(alertMsg || null);
    setIsPricingModalOpen(true);
  };

  const closePricingModal = () => {
    setPricingAlertMessage(null);
    setIsPricingModalOpen(false);
  };

  // Atomic credit deduction and quota verification execution guard
  const checkAndDeductCredit = async (): Promise<boolean> => {
    // 1. Pro Unlimited Subscribers: full bypass, zero credits consumed if not expired
    if (currentUser?.isPro && currentUser.plan === 'unlimited') {
      const isNotExpired = !currentUser.proExpiresAt || new Date(currentUser.proExpiresAt).getTime() > Date.now();
      if (isNotExpired) {
        return true;
      }
    }

    // 2. Authenticated User with Account (Free, PAYG, Lite, Pro, Unlimited)
    if (currentUser) {
      // Calculate available credits across daily, plan, and paid pools
      const totalAvailable =
        (currentUser.dailyFreeCredits ?? 0) +
        (currentUser.isPro && currentUser.planCredits ? currentUser.planCredits : 0) +
        (currentUser.paidCredits ?? 0);

      // Strictly enforce: If all credit balances are 0 and no active unlimited pass exists
      if (totalAvailable <= 0 && currentUser.credits <= 0) {
        openPricingModal("You've used all your credits. Buy more credits or upgrade to Pro to continue.");
        return false;
      }

      try {
        const { user: updatedUser } = await deductUserCredit(currentUser);
        setCurrentUser(updatedUser);
        return true;
      } catch (err: any) {
        console.error('[Credit Deduction Error]:', err);
        openPricingModal("You've used all your credits. Buy more credits or upgrade to Pro to continue.");
        return false;
      }
    }

    // 3. Guest / Anonymous users: Free Daily Quota (5 free per day)
    const currentQuota = getDailyLimitStatus();
    if (currentQuota.isLimitReached || currentQuota.remaining <= 0) {
      openPricingModal("You've used all your credits. Buy more credits or upgrade to Pro to continue.");
      setIsLimitModalOpen(true);
      return false;
    }

    incrementDailyLimit();
    refreshQuota();
    return true;
  };

  // Handle uploaded file
  const handleFileSelected = async (file: File) => {
    const isAllowed = await checkAndDeductCredit();
    if (!isAllowed) return;

    setIsProcessing(true);
    setProgressPct(10);
    setProgressStep('Reading file data...');

    try {
      const originalUrl = URL.createObjectURL(file);

      const result = await processBackgroundRemoval(file, (pct, step) => {
        setProgressPct(pct);
        setProgressStep(step);
      });

      const newProcessed: ProcessedImage = {
        id: 'img_' + Date.now(),
        originalUrl,
        transparentUrl: result.transparentUrl,
        fileName: file.name,
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
    const isAllowed = await checkAndDeductCredit();
    if (!isAllowed) return;

    setIsProcessing(true);
    setProgressPct(20);
    setProgressStep(`Loading sample: ${sample.title}...`);

    try {
      const result = await processBackgroundRemoval(sample.originalUrl, (pct, step) => {
        setProgressPct(pct);
        setProgressStep(step);
      });

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
    const isAllowed = await checkAndDeductCredit();
    if (!isAllowed) return;

    setIsProcessing(true);
    setProgressPct(15);
    setProgressStep('Fetching image from link...');

    try {
      const result = await processBackgroundRemoval(url, (pct, step) => {
        setProgressPct(pct);
        setProgressStep(step);
      });

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
      />

      {/* User Authentication Modal (Google / Email) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        initialMode={authModalMode}
        pendingPlanName={pendingCheckoutPlan ? getPlanName(pendingCheckoutPlan) : null}
        onSuccess={handleAuthSuccess}
      />

      {/* Lemon Squeezy Pricing & Pro Upgrade Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={closePricingModal}
        currentUser={currentUser}
        onRequireAuth={handleRequireAuthFromPricing}
        onUpgradeSuccess={handleUpgradeSuccess}
        alertMessage={pricingAlertMessage}
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
