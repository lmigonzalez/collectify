# Managed Pricing Integration Guide

This guide explains how to integrate Shopify's managed pricing with your app to automatically track which plan users have selected.

## Overview

With managed pricing, Shopify hosts your plan selection page. When users select a plan:
1. They're redirected to Shopify's hosted pricing page
2. They choose between your plans (Free, Pro, etc.)
3. Shopify handles the subscription
4. Your app queries Shopify's API to get the current plan
5. A webhook notifies your app when the subscription changes

## Architecture

```
User clicks "Manage Plan" 
  → Redirects to Shopify's hosted pricing page
  → User selects a plan
  → Shopify creates/updates subscription
  → Webhook fires to your app (APP_SUBSCRIPTIONS_UPDATE)
  → Your app syncs the plan to your database
  → Your app queries the plan when needed
```

## Setup Steps

### 1. Configure Managed Pricing in Partner Dashboard

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com)
2. Navigate to **Apps** → Select your app
3. Click **Distribution** → **Manage listing**
4. Under **Pricing content**, click **Manage**
5. Click **Settings** and select **Managed pricing**

### 2. Create Your Plans

#### Free Plan
1. Click **Add** under **Public plans**
2. Select **Free** under **Billing**
3. Set **Display name**: `Free Plan`
4. Add features:
   - Basic CSV import/export
   - 100 collections per month
   - Email support
5. Click **Save**

#### Pro Plan
1. Click **Add** under **Public plans**
2. Select **Monthly** under **Billing**
3. Set **Monthly charge**: `$9.99`
4. Set **Free trial duration**: `7` days (optional)
5. Set **Display name**: `Pro Plan`
6. Add features:
   - Unlimited collections per month
   - Bulk operations
   - Advanced filtering
   - Priority support
   - API access
7. Click **Save**

### 3. Set Up the Subscription Webhook

The webhook `APP_SUBSCRIPTIONS_UPDATE` fires when:
- A merchant subscribes to a plan
- A subscription is updated
- A subscription is cancelled

#### Register the Webhook

You can register webhooks in two ways:

**Option A: Via Partner Dashboard**
1. Go to **Settings** → **Webhooks**
2. Click **Add webhook**
3. Select topic: `APP_SUBSCRIPTIONS_UPDATE`
4. Set URL: `https://your-app.com/api/webhooks/subscriptions/update`
5. Click **Save**

**Option B: Via API (Programmatic)**
```typescript
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

### 4. Update Database Schema

Run the migration to add the `shopifySubscriptionId` field:

```bash
npx prisma migrate dev --name add_shopify_subscription_id
```

This adds a field to store Shopify's subscription GraphQL ID for reference.

### 5. Configure Welcome Links (Optional)

After a user selects a plan, they're redirected to a "welcome link". You can customize this per plan:

1. In your plan settings, find **Welcome link**
2. For embedded apps: use a relative path like `/collections` or `/guide`
3. For standalone apps: use a full URL like `https://your-app.com/welcome?plan=pro`

A `charge_id` parameter is automatically added to the URL.

## How It Works

### Plan Detection Flow

1. **User visits your plan page** (`/plan`)
2. **Your app queries Shopify** via `/api/subscriptions/status`
3. **Shopify returns the active subscription**:
   ```json
   {
     "hasActiveSubscription": true,
     "plan": "pro",
     "subscription": {
       "id": "gid://shopify/AppSubscription/12345",
       "name": "Pro Plan",
       "status": "ACTIVE",
       "test": false
     }
   }
   ```
4. **Your app displays**: "Your Current Plan: Pro"

### Webhook Sync Flow

1. **User changes their plan** on Shopify's hosted page
2. **Shopify fires webhook** to `/api/webhooks/subscriptions/update`
3. **Webhook handler verifies HMAC** signature
4. **Extracts plan name** from subscription name
5. **Updates your database**:
   ```typescript
   await prisma.subscription.upsert({
     where: { shop },
     update: {
       plan: "premium", // or "free"
       status: "active",
       shopifySubscriptionId: "gid://shopify/AppSubscription/12345"
     }
   });
   ```

## API Endpoints

### GET `/api/subscriptions/status`

Returns the current active subscription from Shopify.

**Response:**
```json
{
  "hasActiveSubscription": true,
  "plan": "pro",
  "subscription": {
    "id": "gid://shopify/AppSubscription/12345",
    "name": "Pro Plan",
    "status": "ACTIVE",
    "test": false,
    "trialDays": 7,
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "shop": "example.myshopify.com"
}
```

### GET `/api/subscriptions/history`

Returns all subscriptions for the shop (active, cancelled, expired).

### POST `/api/webhooks/subscriptions/update`

Webhook handler that syncs subscription changes to your database.

## Plan Name Mapping

Your Shopify plan names need to be mapped to your internal plan types:

```typescript
function extractPlanName(subscriptionName: string): string {
  const lowerName = subscriptionName.toLowerCase();
  
  if (lowerName.includes("pro") || lowerName.includes("premium")) {
    return "pro";
  }
  
  return "free";
}
```

**Customize this function** in:
- `/app/api/subscriptions/status/route.ts`
- `/app/api/webhooks/subscriptions/update/route.ts`

## Testing

### Test with Development Stores

1. Install your app on a development store
2. Navigate to the plan page
3. Click "Manage plan"
4. You'll see Shopify's hosted pricing page
5. Select a plan (test subscriptions are free on dev stores)
6. Check your app displays: "Your Current Plan: Pro"

### Test Webhooks Locally

Use a tunnel service like Cloudflare Tunnel or ngrok:

```bash
# Start your app
npm run dev

# In another terminal, start tunnel
cloudflare tunnel --url http://localhost:3000
```

Then register the webhook with your tunnel URL:
```
https://your-tunnel.trycloudflare.com/api/webhooks/subscriptions/update
```

### Verify Webhook Delivery

1. Change plans on a test store
2. Check your app logs for webhook receipt:
   ```
   📬 Received subscription update webhook: {
     shop: 'test-store.myshopify.com',
     subscriptionId: 'gid://shopify/AppSubscription/12345',
     name: 'Pro Plan',
     status: 'ACTIVE'
   }
   ✅ Successfully synced subscription to database
   ```

## Troubleshooting

### "No active subscription found"

This means:
- User hasn't selected a paid plan yet → They're on free plan
- Subscription was cancelled → Check subscription history

### Webhook not receiving events

1. **Verify webhook is registered**: Check Partner Dashboard → Webhooks
2. **Check URL is public**: Localhost won't work (use tunnel)
3. **Verify HMAC**: Check that `SHOPIFY_API_SECRET` env variable is correct
4. **Check webhook logs**: Partner Dashboard shows delivery attempts

### Plan not syncing

1. **Check webhook handler logs** for errors
2. **Verify database migration** was run
3. **Check plan name mapping** - does your logic correctly extract the plan?

## Best Practices

1. **Always query Shopify for authoritative data** - Don't rely solely on your database
2. **Handle webhook delays** - Webhooks can take minutes to arrive
3. **Support both free and paid plans** - Check for `activeSubscriptions.length === 0`
4. **Test thoroughly** - Try plan upgrades, downgrades, and cancellations
5. **Monitor webhook failures** - Set up alerts for failed webhook deliveries

## Related Documentation

- [Shopify Managed Pricing Docs](https://shopify.dev/docs/apps/launch/billing/managed-pricing)
- [App Subscriptions API](https://shopify.dev/docs/api/admin-graphql/latest/objects/AppSubscription)
- [Webhooks Best Practices](https://shopify.dev/docs/apps/webhooks/best-practices)

## Next Steps

After setting up managed pricing:

1. ✅ Configure plans in Partner Dashboard
2. ✅ Register `APP_SUBSCRIPTIONS_UPDATE` webhook
3. ✅ Run database migration
4. ✅ Test on a development store
5. ✅ Monitor webhook delivery
6. ✅ Update usage limits based on plan
7. ✅ Display plan information in your app

