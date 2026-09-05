# Security Hardening Changes

## Required deployment step
Run `supabase_schema.sql` in the Supabase SQL editor (or apply the final hardening migration section) before deploying this build.

## What changed
- Browser profile synchronization no longer sends plan, is_pro, credit pools, expiry, or totals to Supabase.
- Credit deduction now fails closed when Supabase is unavailable; it does not fall back to browser-controlled balances.
- Client-side pre-authorisation checks for unlimited plans and balances were removed from the processing path.
- `deduct_credit` now verifies `auth.uid() = user_id`, preventing one authenticated user from deducting another user's balance.
- Anonymous execution of the credit RPC is revoked.
- Column-level grants restrict authenticated profile updates to `name` and `avatar_url`.
- Credit transaction writes are revoked from browser roles.
- A baseline CSP was added to Vercel headers.

## Still required server-side
- Keep Lemon Squeezy webhook signing secret and Supabase service-role key server-side only.
- Webhook handler must validate signature, event type, order/user mapping and idempotency before changing credits.
- Apply rate limiting / bot protection to any server endpoint that performs paid work.
- If anonymous free processing must be abuse-resistant, move guest quota and image processing authorization to a server endpoint; localStorage is not a security boundary.

## Guest quota hardening (3/day)
Guest usage is now consumed through `/api/guest-credit` and stored in `guest_daily_usage` using a salted HMAC of the request IP. Clearing browser cache/localStorage no longer resets the server-side quota. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a long random `GUEST_RATE_SALT` only in Vercel/server environment variables, then apply the appended SQL migration.

Note: IP-based limits are abuse-resistant, not identity-proof. VPN/proxy/IP rotation can obtain a new network identity. For the strongest enforcement, require sign-in before granting free credits and keep signed-in credits in the existing profile/RPC flow.
