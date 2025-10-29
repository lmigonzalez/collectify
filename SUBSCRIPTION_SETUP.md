# Subscription Management Setup

This document explains how the subscription management system works in your Collectify app.

## Overview

Your app now supports three subscription plans:
- **Free Plan**: $0/month - Up to 100 collections per month
- **Pro Plan (Monthly)**: $10/month - Unlimited collections with batch processing
- **Pro Plan (Yearly)**: $100/year - Same as monthly but save 17% ($20/year)

## How It Works

1. **Plan Selection**: Users visit `/plan` to see available plans
2. **Subscription Creation**: When a user selects a plan, the app creates a subscription via Shopify's GraphQL API
3. **Shopify Hosted Portal**: Users are redirected to Shopify's billing portal to approve the subscription
4. **Return**: After approval, users are redirected back to your app

## Files Created/Modified

### API Routes
- `app/api/subscriptions/create/route.ts` - Creates new subscriptions
- `app/api/subscriptions/status/route.ts` - Fetches current subscription status

### Components
- `app/(pages)/plan/page.tsx` - Plan selection page with subscription management

### Utilities
- `lib/subscription-utils.ts` - Helper functions for subscription management
- `lib/subscription-middleware.ts` - Middleware for protecting routes based on subscription

### Configuration
- `shopify.app.toml` - Updated with `write_apps` scope
- `lib/shopify.ts` - Updated with billing scopes

## Usage Examples

### Check Subscription Status
```typescript
import { getSubscriptionInfo } from "@/lib/subscription-utils";

const subscriptionInfo = await getSubscriptionInfo("your-shop.myshopify.com");
console.log(subscriptionInfo.isProPlan); // true/false
console.log(subscriptionInfo.subscription?.price.amount); // 0 or 29.99
```

### Protect Routes
```typescript
import { subscriptionMiddleware } from "@/lib/subscription-middleware";

// Protect a route that requires Pro plan
export async function middleware(request: NextRequest) {
  return subscriptionMiddleware(request, {
    requiredFeature: "api_access",
    allowFreePlan: false,
    redirectTo: "/plan"
  });
}
```

### Check Feature Access
```typescript
import { hasFeatureAccess } from "@/lib/subscription-utils";

const canUseAPI = hasFeatureAccess(subscriptionInfo, "api_access");
const canBatchProcessing = hasFeatureAccess(subscriptionInfo, "batch_processing");
```

## Plan Features

### Free Plan
- ✓ Basic collection management
- ✓ Up to 100 collections per month
- ✓ CSV import/export (100 collections/month)
- ✓ Basic support

### Pro Plan (Monthly)
- ✓ Everything in Free Plan
- ✓ Unlimited collections per month
- ✓ Batch processing (1000 collections per batch)
- ✓ Priority support
- ✓ Advanced analytics
- ✓ API access

### Pro Plan (Yearly)
- ✓ Everything in Pro Monthly
- ✓ 17% savings vs monthly billing
- ✓ Same features as monthly plan

## Shopify Hosted Portal

When users select a plan, they're redirected to Shopify's hosted billing portal:
```
https://admin.shopify.com/store/:store_handle/charges/:app_handle/pricing_plans
```

This portal handles:
- Payment method collection
- Subscription approval
- Billing management
- Payment method updates

## Testing

1. **Development**: Use test charges by setting `test: true` in the GraphQL mutation
2. **Production**: Remove the test flag for real billing

## Environment Variables

Make sure these are set in your `.env` file:
```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app-url.com
```

## Next Steps

1. **Test the flow**: Try selecting both plans in development
2. **Customize features**: Update the feature lists in `subscription-utils.ts`
3. **Add protection**: Use the middleware to protect premium features
4. **Monitor usage**: Set up webhooks to track subscription changes

## Webhooks (Optional)

Consider setting up these webhooks to monitor subscription changes:
- `APP_SUBSCRIPTIONS_UPDATE` - When subscription status changes
- `APP_SUBSCRIPTIONS_APPROACHING_CAPPED_AMOUNT` - When approaching usage limits

## Troubleshooting

### Common Issues
1. **Scope errors**: Make sure `write_apps` scope is included
2. **Authentication errors**: Verify your app credentials
3. **Redirect issues**: Check your `returnUrl` configuration

### Debug Tips
- Check browser network tab for API calls
- Verify GraphQL mutations in Shopify GraphiQL
- Check Shopify Partner Dashboard for subscription status
