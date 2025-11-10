# Managed Pricing Quick Reference

## 🎯 What You Have

Your app now automatically detects which plan users selected on Shopify's hosted pricing page.

---

## 📁 New Files

| File | Purpose |
|------|---------|
| `/app/api/subscriptions/status/route.ts` | Get current plan from Shopify |
| `/app/api/webhooks/subscriptions/update/route.ts` | Sync plan changes |
| `/lib/sync-subscription.ts` | Manual sync helper |
| `/prisma/migrations/.../migration.sql` | Database update |

---

## 🔧 Modified Files

| File | What Changed |
|------|--------------|
| `/app/(pages)/plan/page.tsx` | Now displays current plan from Shopify |
| `/prisma/schema.prisma` | Added `shopifySubscriptionId` field |

---

## 🚀 Quick Start (3 Steps)

### 1️⃣ Run Migration
```bash
npx prisma migrate deploy
```

### 2️⃣ Partner Dashboard
1. Apps → Your App → Distribution → Manage listing
2. Pricing content → Manage → Settings
3. Select "Managed pricing"
4. Add plans:
   - **Free Plan**: $0, 100 collections/month
   - **Pro Plan**: $9.99/month, unlimited

### 3️⃣ Register Webhook
**Topic:** `APP_SUBSCRIPTIONS_UPDATE`  
**URL:** `https://your-app.com/api/webhooks/subscriptions/update`

---

## 📡 API Endpoints

### Get Current Plan
```bash
GET /api/subscriptions/status
```
**Response:**
```json
{
  "plan": "pro",
  "subscription": {
    "id": "gid://shopify/AppSubscription/12345",
    "name": "Pro Plan",
    "status": "ACTIVE"
  }
}
```

### Webhook (Auto-sync)
```bash
POST /api/webhooks/subscriptions/update
```
**Triggered when:** User selects/changes/cancels plan

---

## 💻 Usage in Code

### Check Current Plan
```typescript
const response = await fetch("/api/subscriptions/status");
const { plan } = await response.json();
// plan = "free" or "pro"
```

### Get Plan from Database
```typescript
import { getOrCreateSubscription } from "@/lib/subscription";

const sub = await getOrCreateSubscription(shop);
console.log(sub.plan); // "free" or "premium"
```

### Manual Sync
```typescript
import { syncSubscriptionFromShopify } from "@/lib/sync-subscription";

const result = await syncSubscriptionFromShopify(shop, admin);
console.log(result.plan); // Latest from Shopify
```

---

## 🎨 UI Display

Your `/plan` page now shows:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Your Current Plan: Pro
  Status: Active
  Subscription: Pro Plan
  
  $9.99 / month
  
  What's included:
  • Unlimited collections per month
  • Bulk operations
  • Priority support
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Manage plan] ← Redirects to Shopify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔄 How It Works

```
User clicks "Manage plan"
  ↓
Shopify's hosted pricing page
  ↓
User selects "Pro Plan"
  ↓
Shopify creates subscription
  ↓
Webhook fires → Your app updates database
  ↓
App shows: "Your Current Plan: Pro"
```

---

## ⚙️ Customization

### Change Plan Mapping

Edit this function in 3 files:
- `/app/api/subscriptions/status/route.ts`
- `/app/api/webhooks/subscriptions/update/route.ts`
- `/lib/sync-subscription.ts`

```typescript
function extractPlanName(subscriptionName: string): string {
  const lowerName = subscriptionName.toLowerCase();
  
  // Your logic here
  if (lowerName.includes("business")) {
    return "business";
  }
  if (lowerName.includes("pro")) {
    return "pro";
  }
  
  return "free";
}
```

### Update "Manage plan" URL

In `/app/(pages)/plan/page.tsx`:
```typescript
href="https://admin.shopify.com/charges/YOUR-APP-HANDLE/pricing_plans"
```
Replace `YOUR-APP-HANDLE` with your actual app handle.

---

## 🧪 Testing

### Local
```bash
# Terminal 1
npm run dev

# Terminal 2
cloudflare tunnel --url http://localhost:3000
```

Then:
1. Register webhook with tunnel URL
2. Install on dev store
3. Go to `/plan` → Click "Manage plan"
4. Select a plan
5. Check logs for: `📬 Received subscription update webhook`

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Shows "Free" but selected "Pro" | Check webhook logs, verify HMAC secret |
| Webhook not firing | Verify URL is public, check Partner Dashboard logs |
| 401 error on webhook | Verify `SHOPIFY_API_SECRET` is correct |
| "Manage plan" button broken | Update app handle in URL |

---

## 📚 Documentation

- **Full Guide:** `MANAGED_PRICING_INTEGRATION.md`
- **Quick Start:** `QUICK_START_MANAGED_PRICING.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Shopify Docs:** https://shopify.dev/docs/apps/launch/billing/managed-pricing

---

## ✅ Checklist

### Code (Done ✓)
- [x] API endpoint for current plan
- [x] Webhook handler
- [x] Database migration
- [x] UI updates

### Setup (To Do)
- [ ] Enable managed pricing in Partner Dashboard
- [ ] Create plans (Free, Pro)
- [ ] Register webhook
- [ ] Run migration
- [ ] Update app handle in "Manage plan" URL
- [ ] Test on dev store
- [ ] Deploy to production

---

## 🎉 Result

Users can now:
1. Click "Manage plan" in your app
2. Select a plan on Shopify's page
3. Your app automatically knows which plan they chose
4. No manual API calls needed (webhook handles it)

**It just works!** ✨

