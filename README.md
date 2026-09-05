# bgremover.art — Production Deployment, Security Hardening & High-Scale (10,000+ Users) Guide

Welcome to **bgremover.art**, an ultra-fast, automatic AI background removal utility web application featuring client-side canvas editing, before/after comparison sliders, passport photo presets, a daily free quota engine (3 free removals/24h), production Google OAuth 2.0 authentication (`prompt: 'select_account'`), and a 4-tier Lemon Squeezy monetization system.

---

## 📋 Table of Contents
1. [🔒 Security Hardening & Zero-Leakage Architecture](#1-🔒-security-hardening--zero-leakage-architecture)
2. [⚡ Performance Optimization & Speed Blueprint](#2-⚡-performance-optimization--speed-blueprint)
3. [🌐 Scalability & Hosting Recommendation (10,000+ Active Users)](#3-🌐-scalability--hosting-recommendation-10000-active-users)
4. [🛠️ Dashboard Environment Variables Configuration](#4-🛠️-dashboard-environment-variables-configuration)
5. [⚙️ Production Credentials & File Mapping](#5-⚙️-production-credentials--file-mapping)
6. [🧪 Pre-Deployment Testing Checklist](#6-🧪-pre-deployment-testing-checklist)

---

## 1. 🔒 Security Hardening & Zero-Leakage Architecture

The codebase enforces strict zero-trust security boundaries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (BROWSER / VERCEL)                          │
│  - Only VITE_ prefixed public variables compiled into JavaScript bundle      │
│  - No webhook secrets, database passwords, or private API keys              │
│  - Client-side image sanitization & pre-resizing (<2048px, max 10MB)        │
│  - Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / TLS 1.3
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (PYTHON FASTAPI DOCKER)                        │
│  - Sliding Window IP Rate Limiting (60 requests/min per IP)                 │
│  - Strict HMAC SHA-256 Lemon Squeezy webhook signature verification         │
│  - Automatic 5-minute file purge in background task                         │
│  - Multi-worker ONNX u2net runtime with intra/inter-op thread limits        │
│  - CORS origin whitelist (production domain & subdomains only)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Security Controls Implemented:
1. **Zero Client-Side Secret Leakage**:
   - `LEMONSQUEEZY_WEBHOOK_SECRET` and private credentials are kept exclusively on the server (`app/main.py`).
   - All client-side environment variables in `.env.example` are strictly prefixed with `VITE_`.
2. **Timing-Safe Webhook Signature Verification**:
   - Webhook requests from Lemon Squeezy are verified using `hmac.compare_digest` with HMAC SHA-256 signatures from `X-Signature`.
3. **MIME Validation & Image Sanitization**:
   - Uploads are validated against strict allowed MIME types (`image/jpeg`, `image/png`, `image/webp`).
   - Image integrity is verified via `PIL.Image.verify()` to prevent malformed binary exploits.
4. **IP Rate Limiting**:
   - `/api/remove-bg` enforces a 60 requests/minute limit per client IP using an in-memory sliding window, returning HTTP `429 Too Many Requests` when exceeded.
5. **Security Headers**:
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 2. ⚡ Performance Optimization & Speed Blueprint

To process thousands of requests concurrently with sub-second turnaround:

### A. Frontend Optimizations:
1. **Client-Side Pre-Resizing**:
   - Images larger than 2048px are pre-resized directly on an HTML5 canvas in the browser before network transmission, reducing payload size by up to 85% and saving server memory.
2. **Code Splitting & Dynamic Vendor Chunks**:
   - `vite.config.ts` bundles vendor dependencies into separate chunks (`vendor-react`, `vendor-icons`, `vendor-imgly`, `vendor-canvas`) to maximize browser caching and achieve sub-100ms first-contentful-paint (FCP).
3. **Edge Asset Caching**:
   - `vercel.json` configures immutable 1-year cache headers (`public, max-age=31536000, immutable`) for `/assets/*` bundles.

### B. Backend AI Inference Tuning:
1. **ONNX Runtime Session Optimization**:
   - `app/main.py` configures ONNX session options with graph optimizations enabled (`ORT_ENABLE_ALL`) and limits thread pools to physical CPU cores (`intra_op_num_threads = 4`).
2. **Container Model Pre-Caching**:
   - `app/Dockerfile` pre-downloads the `u2net` ONNX model during image build, eliminating cold-start model download delays.
3. **Automated Memory Cleanup**:
   - Temporary buffers and cutouts older than 300 seconds (5 minutes) are purged asynchronously every 60 seconds.

---

## 3. 🌐 Scalability & Hosting Recommendation (10,000+ Active Users)

For a high-traffic production setup handling 10,000+ users cost-effectively:

| Layer | Recommended Platform | Plan / Tier | Why This Choice |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **Vercel** or **Cloudflare Pages** | Free / Pro | Global Edge CDN with zero cold starts, auto-scaling, automated CI/CD from GitHub. |
| **Backend AI API** | **Render** / **Railway** / **Google Cloud Run** | Hobby ($7/mo) or Free | Runs Docker container (`app/Dockerfile`) with 2-4 vCPUs and ONNX runtime support. |
| **CDN & DNS** | **Cloudflare** | Free | Free DDoS protection, TLS 1.3, Brotli compression, and rate limiting. |
| **Database & Auth** | **Firebase** or **Supabase** | Free Tier (50,000 MAU) | Serverless authentication, instant account synchronization, no server maintenance. |
| **Monetization** | **Lemon Squeezy** | Pay-as-you-go (5% + 50¢) | Merchant of record, handles global tax, invoicing, subscriptions, and card processing. |

---

## 4. 🛠️ Dashboard Environment Variables Configuration

Do **NOT** commit `.env` to your Git repository. Instead, configure variables directly in your hosting dashboards:

### Step 1: Vercel Dashboard (Frontend)
1. Navigate to **Project Settings > Environment Variables** in [vercel.com](https://vercel.com).
2. Add the following public variables:
   - `VITE_APP_URL` = `https://bgremover.art`
   - `VITE_API_BASE_URL` = `https://api.bgremover.art` (Your backend API URL)
   - `VITE_GOOGLE_CLIENT_ID` = `your_google_client_id.apps.googleusercontent.com`
   - `VITE_LEMONSQUEEZY_PRO_URL` = `https://your-store.lemonsqueezy.com/buy/pro-monthly`
   - `VITE_LEMONSQUEEZY_LITE_URL` = `https://your-store.lemonsqueezy.com/buy/lite-monthly`
   - `VITE_LEMONSQUEEZY_PAYG_10_URL` = `https://your-store.lemonsqueezy.com/buy/credit-pack-10`
   - `VITE_LEMONSQUEEZY_UNLIMITED_URL` = `https://your-store.lemonsqueezy.com/buy/unlimited-monthly`
3. Click **Save** and trigger a redeployment.

### Step 2: Render / Railway Dashboard (Backend)
1. Go to your Web Service settings in [render.com](https://render.com) or [railway.app](https://railway.app).
2. Under **Environment Variables**, add the server-only secrets:
   - `LEMONSQUEEZY_WEBHOOK_SECRET` = `your_webhook_signing_secret`
   - `ENV` = `production`
   - `WEB_CONCURRENCY` = `2`
   - `MAX_FILE_SIZE_MB` = `10`
   - `FILE_LIFETIME_SECONDS` = `300`
   - `RATE_LIMIT_MAX_REQUESTS` = `60`
   - `ALLOWED_ORIGINS` = `https://bgremover.art,https://www.bgremover.art`
3. Save changes; the service will restart with the new configuration.

---

## 5. ⚙️ Production Credentials & File Mapping

| Purpose | Target File Path | What to Configure |
| :--- | :--- | :--- |
| **Frontend API Base** | `/src/utils/imageProcessing.ts` | Uses `import.meta.env.VITE_API_BASE_URL` with automatic client-side WASM fallback. |
| **Official Google OAuth** | `/src/utils/auth.ts` | Official Google Identity Services SDK (`initTokenClient`) with `prompt: 'select_account'`. |
| **Lemon Squeezy Checkout** | `/src/utils/lemonsqueezy.ts` | Builds direct full-page checkout URLs passing customer email and custom user ID. |
| **Pricing & Plans Modal** | `/src/components/PricingModal.tsx` | Responsive 4-tier cards with instant full-page redirect. |
| **Backend API & Webhook** | `/app/main.py` | Rate-limited AI background removal and Lemon Squeezy HMAC signature webhook. |
| **Container Build** | `/app/Dockerfile` | Multi-stage Python 3.10 slim container with u2net ONNX model pre-baked. |
| **Edge Cache & Headers** | `/vercel.json` | Caching rules and security headers for global edge deployment. |

---

## 6. 🧪 Pre-Deployment Testing Checklist

Run through this test checklist locally or on staging before going live:

```bash
# 1. Build and lint check
npm run lint
npm run build

# 2. Local Backend execution test
cd app
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

- [x] **Rate Limit Test**: Send >60 POST requests to `/api/remove-bg` and confirm HTTP 429 response.
- [x] **Large File Rejection**: Upload a file >10MB and confirm HTTP 413 error.
- [x] **MIME Validation**: Upload a `.txt` or `.exe` and verify HTTP 400 rejection.
- [x] **Google OAuth 2.0**: Verify native Google popup launches with account chooser.
- [x] **Lemon Squeezy Redirect**: Click any plan and confirm direct navigation to checkout.
- [x] **Webhook Signature Verification**: Verify webhook endpoint rejects invalid HMAC signatures.
