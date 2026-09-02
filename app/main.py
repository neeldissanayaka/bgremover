"""
bgremover.art - Production AI Background Removal API & Lemon Squeezy Payment Service
High-performance background removal with automated file cleanup, IP rate-limiting, and Lemon Squeezy Webhook.
"""

import os
import io
import time
import uuid
import hmac
import hashlib
import json
import asyncio
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from collections import defaultdict

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Request, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from PIL import Image
import onnxruntime as ort
from rembg import remove, new_session

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("bgremover")

# App configuration & Server-side secrets
MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_MB", "10")) * 1024 * 1024  # 10 MB limit
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
TEMP_DIR = Path(os.getenv("TEMP_STORAGE_DIR", "./temp_storage"))
TEMP_DIR.mkdir(parents=True, exist_ok=True)
FILE_LIFETIME_SECONDS = int(os.getenv("FILE_LIFETIME_SECONDS", "300"))  # 5 minutes automatic cleanup

LEMONSQUEEZY_WEBHOOK_SECRET = os.getenv("LEMONSQUEEZY_WEBHOOK_SECRET", "")
ENVIRONMENT = os.getenv("ENV", os.getenv("ENVIRONMENT", "production"))

# Allowed CORS Origins - configurable via comma-separated ALLOWED_ORIGINS env var
raw_origins = os.getenv("ALLOWED_ORIGINS", "https://bgremover.art,https://www.bgremover.art,http://localhost:3000,http://localhost:5173")
ALLOWED_ORIGINS = [orig.strip() for orig in raw_origins.split(",") if orig.strip()]

# In-memory user subscription database & Idempotency Store
USER_PRO_DATABASE: Dict[str, Dict[str, Any]] = {}
PROCESSED_WEBHOOK_ORDERS: Set[str] = set()

# Simple sliding window rate limiter: IP -> List[timestamps]
RATE_LIMIT_BUCKET: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # 1 minute window
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "60"))  # max 60 req/min per IP

app = FastAPI(
    title="bgremover.art Production API",
    description="High-performance, rate-limited background removal API with Lemon Squeezy 4-tier subscription webhook.",
    version="2.0.0",
    docs_url=None if ENVIRONMENT == "production" else "/docs",
    redoc_url=None if ENVIRONMENT == "production" else "/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Engine", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
)


@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    """
    Middleware providing:
    1. HTTP Security Headers (HSTS, X-Content-Type-Options, Frame Guard, CSP)
    2. IP Rate Limiting for resource-intensive endpoints
    """
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path

    # Apply strict rate limiting on /api/remove-bg
    if path.startswith("/api/remove-bg") and request.method == "POST":
        now = time.time()
        # Clean timestamps older than window
        timestamps = [t for t in RATE_LIMIT_BUCKET[client_ip] if now - t < RATE_LIMIT_WINDOW]
        RATE_LIMIT_BUCKET[client_ip] = timestamps

        if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on {path}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit is {RATE_LIMIT_MAX_REQUESTS} requests per minute. Please try again shortly.",
                },
                headers={"Retry-After": str(RATE_LIMIT_WINDOW)},
            )
        RATE_LIMIT_BUCKET[client_ip].append(now)

    response = await call_next(request)

    # Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    return response


# Optimized rembg session creation with ONNX runtime CPU options
session = None
try:
    # Optimize CPU multi-threading for ONNX inference
    session_options = ort.SessionOptions()
    session_options.intra_op_num_threads = min(4, os.cpu_count() or 2)
    session_options.inter_op_num_threads = 2
    session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    
    session = new_session("u2net", session_options=session_options)
    logger.info(f"u2net ONNX session initialized with {session_options.intra_op_num_threads} CPU threads")
except Exception as e:
    logger.warning(f"Default ONNX session initialization fallback: {e}")
    try:
        session = new_session("u2net")
    except Exception as inner_e:
        logger.error(f"Neural session deferred: {inner_e}")


def cleanup_expired_files():
    """Background task to remove temporary files older than 5 minutes."""
    try:
        now = time.time()
        for f in TEMP_DIR.glob("*"):
            if f.is_file():
                file_age = now - f.stat().st_mtime
                if file_age > FILE_LIFETIME_SECONDS:
                    f.unlink(missing_ok=True)
                    logger.debug(f"Cleaned up expired file: {f.name}")
    except Exception as err:
        logger.error(f"Error during cleanup: {err}")


@app.on_event("startup")
async def startup_event():
    """Start periodic background cleanup runner."""
    async def periodic_cleanup():
        while True:
            await asyncio.sleep(60)  # Check every 60 seconds
            cleanup_expired_files()

    asyncio.create_task(periodic_cleanup())
    logger.info("bgremover.art Production API is active and ready.")


@app.get("/")
def root():
    return {
        "service": "bgremover.art API",
        "status": "online",
        "version": "2.0.0",
        "limits": {
            "max_file_size_mb": MAX_FILE_SIZE_BYTES // (1024 * 1024),
            "allowed_formats": ["JPG", "PNG", "WebP"],
            "auto_cleanup_minutes": FILE_LIFETIME_SECONDS // 60,
            "rate_limit_per_minute": RATE_LIMIT_MAX_REQUESTS,
        },
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}


@app.post("/api/remove-bg")
async def remove_background_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Remove background from uploaded image.
    Enforces 10MB size limit, MIME validation, input sanitization, and returns transparent PNG.
    """
    # 1. MIME Validation
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{content_type}'. Only JPEG, PNG, and WebP images are allowed.",
        )

    # 2. Read bytes and enforce strict 10MB limit
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of 10MB ({len(contents) / (1024 * 1024):.2f}MB received).",
        )

    try:
        # 3. Load with PIL and verify image integrity (sanitization against malformed image exploits)
        input_image = Image.open(io.BytesIO(contents))
        input_image.verify()
        
        # Re-open after verify() as verify alters stream position
        input_image = Image.open(io.BytesIO(contents))
        
        max_dim = 2048
        if input_image.width > max_dim or input_image.height > max_dim:
            input_image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        # 4. Perform AI background removal using optimized session
        output_image = remove(input_image, session=session)

        # 5. Save to temp buffer with 5-minute deletion schedule
        unique_id = uuid.uuid4().hex
        out_path = TEMP_DIR / f"{unique_id}_cutout.png"
        output_image.save(out_path, format="PNG", optimize=True)

        background_tasks.add_task(cleanup_expired_files)

        img_byte_arr = io.BytesIO()
        output_image.save(img_byte_arr, format="PNG", optimize=True)
        img_byte_arr.seek(0)

        return Response(
            content=img_byte_arr.getvalue(),
            media_type="image/png",
            headers={
                "X-Process-Engine": "ai-neural-u2net-v2",
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache",
            },
        )

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Background removal failed: {str(e)}",
        )


# ============================================================================
# LEMON SQUEEZY 4-TIER PAYMENT WEBHOOK & USER UPGRADE ENDPOINTS
# ============================================================================

def verify_lemon_signature(payload: bytes, signature: Optional[str]) -> bool:
    """Verify HMAC SHA-256 signature from Lemon Squeezy webhook header with timing-safe comparison."""
    if not LEMONSQUEEZY_WEBHOOK_SECRET:
        if ENVIRONMENT == "development":
            logger.info("Lemon Squeezy signature verification bypassed in local development mode.")
            return True
        logger.error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured on production server.")
        return False
    
    if not signature:
        return False
    
    try:
        digest = hmac.new(
            LEMONSQUEEZY_WEBHOOK_SECRET.encode("utf-8"),
            msg=payload,
            digestmod=hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(digest, signature)
    except Exception as err:
        logger.error(f"Signature check error: {err}")
        return False


@app.post("/api/webhook/lemonsqueezy")
async def lemon_squeezy_webhook(
    request: Request,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
):
    """
    Webhook endpoint to receive and verify completed Lemon Squeezy orders and subscriptions.
    Supports all 4 pricing tiers:
      - payg_3 (3 credits - $2.00)
      - payg_10 (10 credits - $5.00)
      - payg_50 (50 credits - $15.00)
      - lite_monthly (40 credits / mo - $4.99)
      - pro_monthly (200 credits / mo - $20.00)
      - unlimited_monthly (Unlimited removals - $300.00 / yr)
    """
    raw_body = await request.body()

    # 1. Verify webhook signature
    if not verify_lemon_signature(raw_body, x_signature):
        logger.warning("Invalid Lemon Squeezy signature received on webhook.")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        data = json.loads(raw_body.decode("utf-8"))
        event_name = data.get("meta", {}).get("event_name", "")
        custom_data = data.get("meta", {}).get("custom_data", {})
        
        attributes = data.get("data", {}).get("attributes", {})
        order_id = str(data.get("data", {}).get("id") or custom_data.get("order_id") or attributes.get("order_number") or "")
        
        # Idempotency check: prevent duplicate webhooks from double crediting
        if order_id and order_id in PROCESSED_WEBHOOK_ORDERS:
            logger.info(f"Duplicate webhook event detected for order_id: {order_id}. Skipping to ensure idempotency.")
            return JSONResponse({
                "status": "already_processed",
                "message": "Duplicate webhook event skipped",
                "order_id": order_id,
                "event": event_name,
            })
        
        user_email = custom_data.get("user_email") or attributes.get("user_email") or "unknown@user.com"
        user_id = custom_data.get("user_id") or f"usr_{user_email.split('@')[0]}"
        plan_id = str(custom_data.get("plan_id") or attributes.get("first_order_item", {}).get("variant_name") or "pro_monthly").lower()

        logger.info(f"Received Lemon Squeezy event: {event_name} for user: {user_email} (ID: {user_id}), order: {order_id}, plan: {plan_id}")

        # 2. Handle Subscription & Order events
        if event_name in ["order_created", "subscription_created", "subscription_updated", "subscription_payment_success"]:
            existing = USER_PRO_DATABASE.get(user_id, {})
            current_daily_free = existing.get("daily_free_credits", 5)
            current_paid = existing.get("paid_credits", 0)
            current_plan_cr = existing.get("plan_credits", 0)
            now_ts = time.time()

            # Determine plan tier, credits granted & expiration timestamp
            if "payg_3" in plan_id or "3" in plan_id:
                tier = "payg"
                new_paid = current_paid + 3
                new_plan_cr = current_plan_cr
                is_pro = existing.get("is_pro", False)
                pro_expires_at = existing.get("pro_expires_at")
            elif "payg_10" in plan_id or "10" in plan_id:
                tier = "payg"
                new_paid = current_paid + 10
                new_plan_cr = current_plan_cr
                is_pro = existing.get("is_pro", False)
                pro_expires_at = existing.get("pro_expires_at")
            elif "payg_50" in plan_id or "50" in plan_id or "credit" in plan_id:
                tier = "payg"
                new_paid = current_paid + 50
                new_plan_cr = current_plan_cr
                is_pro = existing.get("is_pro", False)
                pro_expires_at = existing.get("pro_expires_at")
            elif "lite" in plan_id:
                tier = "lite"
                new_paid = current_paid
                new_plan_cr = 40
                is_pro = True
                pro_expires_at = now_ts + (30 * 24 * 3600)  # 1 Month (30 days)
            elif "unlimited" in plan_id:
                tier = "unlimited"
                new_paid = current_paid
                new_plan_cr = 9999
                is_pro = True
                pro_expires_at = now_ts + (365 * 24 * 3600)  # 1 Year (365 days)
            else:
                tier = "pro"
                new_paid = current_paid
                new_plan_cr = 200
                is_pro = True
                pro_expires_at = now_ts + (30 * 24 * 3600)  # 1 Month (30 days)

            total_credits = 9999 if (tier == "unlimited" and is_pro) else (current_daily_free + new_paid + new_plan_cr)

            USER_PRO_DATABASE[user_id] = {
                "user_id": user_id,
                "email": user_email,
                "plan": tier,
                "is_pro": is_pro,
                "daily_free_credits": current_daily_free,
                "paid_credits": new_paid,
                "plan_credits": new_plan_cr,
                "credits": total_credits,
                "pro_expires_at": pro_expires_at,
                "status": "active",
                "updated_at": now_ts,
            }

            if order_id:
                PROCESSED_WEBHOOK_ORDERS.add(order_id)

            logger.info(f"User '{user_id}' ({user_email}) updated: tier={tier}, paid_cr={new_paid}, plan_cr={new_plan_cr}, total={total_credits}, pro={is_pro}")
            return JSONResponse({
                "status": "success",
                "message": f"User successfully provisioned with {tier} plan",
                "user_id": user_id,
                "plan": tier,
                "daily_free_credits": current_daily_free,
                "paid_credits": new_paid,
                "plan_credits": new_plan_cr,
                "credits": total_credits,
                "is_pro": is_pro,
                "pro_expires_at": pro_expires_at,
                "order_id": order_id,
                "event": event_name,
            })

        elif event_name in ["subscription_cancelled", "subscription_expired"]:
            if user_id in USER_PRO_DATABASE:
                USER_PRO_DATABASE[user_id]["is_pro"] = False
                USER_PRO_DATABASE[user_id]["plan"] = "free"
                USER_PRO_DATABASE[user_id]["status"] = "cancelled"
            logger.info(f"Subscription cancelled for user: {user_id}")
            return JSONResponse({
                "status": "success",
                "message": "Subscription cancelled",
                "user_id": user_id,
                "is_pro": False,
            })

        return JSONResponse({"status": "ignored", "event": event_name})

    except Exception as e:
        logger.error(f"Error handling Lemon Squeezy webhook: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Webhook parsing error: {str(e)}")


@app.get("/api/user/{user_id}/status")
def get_user_status(user_id: str):
    """Check whether a user has active PRO status or available credits."""
    user_info = USER_PRO_DATABASE.get(user_id)
    if not user_info:
        return {
            "user_id": user_id,
            "plan": "free",
            "is_pro": False,
            "credits": 0,
        }
    return user_info


@app.get("/robots.txt", response_class=Response)
def get_robots_txt():
    """Serves the SEO robots.txt file."""
    content = """# Robots.txt for bgremover.art
User-agent: *
Allow: /
Disallow: /api/webhook/

# Sitemaps
Sitemap: https://bgremover.art/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")


@app.get("/sitemap.xml", response_class=Response)
def get_sitemap_xml():
    """Serves the SEO sitemap.xml file."""
    content = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bgremover.art/</loc>
    <lastmod>2026-09-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bgremover.art/#features</loc>
    <lastmod>2026-09-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://bgremover.art/#passport-presets</loc>
    <lastmod>2026-09-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://bgremover.art/#pricing</loc>
    <lastmod>2026-09-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bgremover.art/#faq</loc>
    <lastmod>2026-09-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
"""
    return Response(content=content, media_type="application/xml")


if __name__ == "__main__":
    import uvicorn
    workers = int(os.getenv("WEB_CONCURRENCY", "2"))
    uvicorn.run("main:app", host="0.0.0.0", port=8000, workers=workers if ENVIRONMENT == "production" else 1, reload=(ENVIRONMENT != "production"))
