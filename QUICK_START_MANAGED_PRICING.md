# Quick Start: Managed Pricing Integration

## What You Have Now

Your app now has full integration with Shopify's managed pricing! Here's what's been implemented:

### ✅ Completed Implementation

1. **API Endpoint to Get Current Plan**
   - `GET /api/subscriptions/status` - Returns the active subscription from Shopify
   - Automatically determines if user is on "free" or "pro" plan

2. **Webhook Handler for Subscription Updates**
   - `POST /api/webhooks/subscriptions/update` - Syncs plan changes to your database
   - Handles subscription creation, updates, and cancellations
   - Verifies HMAC signatures for security

3. **Updated Plan Page**
   - Now displays: "Your Current Plan: [Free/Pro]"
   - Shows subscription details from Shopify
   - Shows if it's a test subscription

4. **Database Schema**
   - Added `shopifySubscriptionId` field to track Shopify's subscription ID
   - Migration file created and ready to run

5. **Helper Functions**
   - `syncSubscriptionFromShopify()` - Manually sync plan from Shopify
   - `extractPlanName()` - Maps Shopify plan names to your internal plans

## Next Steps

### 1. Run the Database Migration

When you're ready to deploy, run:

```bash
npx prisma migrate deploy
```

Or for local development with network access:

```bash
npx prisma migrate dev
```

### 2. Set Up Managed Pricing in Partner Dashboard

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Select your app → **Distribution** → **Manage listing**
3. Under **Pricing content**, click **Manage** → **Settings**
4. Select **Managed pricing**
5. Add your plans:
   - **Free Plan**: Free, 100 collections/month
   - **Pro Plan**: $9.99/month, unlimited collections

📖 Detailed instructions: See `MANAGED_PRICING_INTEGRATION.md`

### 3. Register the Webhook

Register the `APP_SUBSCRIPTIONS_UPDATE` webhook:

**Option A: Partner Dashboard**
- **Settings** → **Webhooks** → **Add webhook**
- Topic: `APP_SUBSCRIPTIONS_UPDATE`
- URL: `https://your-app.com/api/webhooks/subscriptions/update`

**Option B: Programmatic (recommended)**
```typescript
// Add this to your app's initialization or a setup script
const response = await admin.graphql(`
  mutation {
    webhookSubscriptionCreate(
      topic: APP_SUBSCRIPTIONS_UPDATE
      webhookSubscription: {
        format: JSON,
        callbackUrl: "https://your-app.com/api/webhooks/subscriptions/update"
      }
    ) {
      userErrors {
        field
        message
      }
      webhookSubscription {
        id
      }
    }
  }
`);
```

### 4. Customize Plan Name Mapping (Optional)

If your Shopify plan names differ from "Free Plan" and "Pro Plan", update the `extractPlanName()` function in:

- `/app/api/subscriptions/status/route.ts`
- `/app/api/webhooks/subscriptions/update/route.ts`
- `/lib/sync-subscription.ts`

Example:
```typescript
function extractPlanName(subscriptionName: string): string {
  const lowerName = subscriptionName.toLowerCase();
  
  // Your custom mapping
  if (lowerName.includes("advanced") || lowerName.includes("business")) {
    return "pro";
  }
  
  return "free";
}
```

### 5. Test Everything

1. Install your app on a development store
2. Navigate to `/plan` in your app
3. Click "Manage plan" (redirects to Shopify's hosted pricing page)
4. Select the "Pro Plan"
5. Return to your app
6. Verify it shows "Your Current Plan: Pro"

## How to Use

### Display Current Plan Anywhere

```typescript
// In any component or API route
const response = await fetch("/api/subscriptions/status");
const data = await response.json();

console.log(data.plan); // "free" or "pro"
console.log(data.subscription?.name); // "Pro Plan"
```

### Check Plan in Middleware

```typescript
import { getOrCreateSubscription } from "@/lib/subscription";

const subscription = await getOrCreateSubscription(shop);
console.log(subscription.plan); // "free" or "premium"
```

### Manually Sync from Shopify

```typescript
import { syncSubscriptionFromShopify } from "@/lib/sync-subscription";

const result = await syncSubscriptionFromShopify(shop, admin);
console.log(result.plan); // Current plan from Shopify
```

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SELECTS PLAN                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           Shopify Hosted Pricing Page (Managed Pricing)          │
│                                                                   │
│  ┌─────────────┐                              ┌─────────────┐   │
│  │  FREE PLAN  │                              │  PRO PLAN   │   │
│  │  $0/month   │                              │  $9.99/mo   │   │
│  └─────────────┘                              └─────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ User selects Pro
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Shopify Creates Subscription                  │
│               (APP_SUBSCRIPTIONS_UPDATE webhook)                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          POST /api/webhooks/subscriptions/update                 │
│                                                                   │
│  1. Verify HMAC                                                  │
│  2. Extract plan name from subscription.name                     │
│  3. Update database: { plan: "premium", status: "active" }      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Now Synced                           │
│         subscriptions.plan = "premium"                           │
│         subscriptions.shopifySubscriptionId = "gid://..."        │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              User Views /plan Page                               │
│                                                                   │
│  GET /api/subscriptions/status                                   │
│    ↓                                                             │
│  Query Shopify GraphQL API                                       │
│    ↓                                                             │
│  Returns: { plan: "pro", subscription: {...} }                  │
│    ↓                                                             │
│  Display: "Your Current Plan: Pro"                              │
└─────────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Issue: "Your Current Plan: Free" but I selected Pro

**Solution:** 
1. Check if webhook was received (check logs)
2. Verify webhook URL is correct and publicly accessible
3. Manually sync: Call `/api/subscriptions/status` and check response
4. Check database: Run `SELECT * FROM subscriptions WHERE shop = 'your-shop.myshopify.com'`

### Issue: Webhook not being called

**Solution:**
1. Verify webhook is registered in Partner Dashboard
2. Use a tunnel for local testing (ngrok, cloudflare tunnel)
3. Check HMAC verification - ensure `SHOPIFY_API_SECRET` is correct
4. Check Shopify Partner Dashboard → Webhooks for delivery attempts

### Issue: Plan shows as "free" in database but "pro" in Shopify

**Solution:**
- The webhook may have failed. Check logs for errors.
- Manually trigger a sync by clicking "Manage plan" and returning to your app.
- Or call `syncSubscriptionFromShopify()` in your code.

## FAQ

**Q: Do I need to manually call the Shopify API every time?**
A: No! The webhook keeps your database in sync. Only query Shopify when:
- You need the most up-to-date status
- You suspect the database is out of sync
- During initial app load (optional)

**Q: What happens if a user downgrades from Pro to Free?**
A: The webhook fires with `status: "CANCELLED"` for the Pro subscription. Your handler updates the database to `plan: "free"`.

**Q: Can I have more than 2 plans?**
A: Yes! Add more plans in Partner Dashboard and update your `extractPlanName()` function to handle them.

**Q: How do I test without charging real money?**
A: Development stores get free test subscriptions automatically. They work exactly like production but don't charge.

## Related Files

- `/app/api/subscriptions/status/route.ts` - Get current plan from Shopify
- `/app/api/webhooks/subscriptions/update/route.ts` - Sync on plan changes
- `/app/(pages)/plan/page.tsx` - Display current plan
- `/lib/sync-subscription.ts` - Helper to manually sync
- `/lib/subscription.ts` - Plan limits and usage tracking
- `/prisma/schema.prisma` - Database schema

## Support

For more detailed documentation, see:
- `MANAGED_PRICING_INTEGRATION.md` - Complete setup guide
- [Shopify Managed Pricing Docs](https://shopify.dev/docs/apps/launch/billing/managed-pricing)

---

🎉 **You're all set!** Your app now fully supports Shopify's managed pricing.

