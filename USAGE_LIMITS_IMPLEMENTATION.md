# Usage Limits Implementation Guide

## Overview

This implementation adds usage limits and subscription management to your Collectify app with a simple 2-plan structure:

- **Free Plan**: $0/month - 100 collections per month, 50 per operation
- **Premium Plan**: $9.99/month - 1000 collections per month, 1000 per operation

## Features Implemented

### 1. Database Schema
- `Subscription` model for tracking shop plans
- `Usage` model for monthly usage tracking
- `UsageLimit` model for plan configurations

### 2. Usage Tracking
- Automatic usage tracking for import/export operations
- Monthly usage limits enforcement
- Per-operation limits enforcement

### 3. Subscription Management
- Plan validation and checking
- Usage statistics and reporting
- Upgrade/downgrade functionality

### 4. User Interface
- Updated plan selection page
- Usage dashboard component
- Upgrade prompts when limits are reached

## Setup Instructions

### 1. Database Migration

Run the Prisma migration to create the new tables:

```bash
npx prisma migrate dev --name add-usage-tracking
```

### 2. Seed Initial Data

Run the seed script to populate usage limits:

```bash
node scripts/seed-usage-limits.js
```

### 3. Update Your Components

Add the usage dashboard to your main page:

```tsx
import UsageDashboard from '@/app/components/UsageDashboard';

// In your page component
<UsageDashboard />
```

## API Endpoints

### Usage Stats
- `GET /api/usage/stats` - Get current usage statistics for a shop

### Import/Export (Updated)
- `POST /api/collections/import` - Now includes usage limit checking
- `GET /api/collections/export` - Now includes usage limit checking

## Usage Limits Logic

### Free Plan
- 100 collections per month total
- 50 collections per single operation
- Basic features only

### Premium Plan
- 1000 collections per month total
- 1000 collections per single operation
- All advanced features

## Error Handling

When users exceed their limits, they receive:
- HTTP 429 (Too Many Requests) status
- Detailed error message with current usage
- Upgrade prompt with link to plan page

## Customization

### Adjusting Limits

Edit the `PLAN_LIMITS` constant in `lib/subscription.ts`:

```typescript
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    monthlyLimit: 100,        // Change this
    perOperationLimit: 50,    // Change this
    price: 0,
    features: [...]
  },
  premium: {
    monthlyLimit: 1000,       // Change this
    perOperationLimit: 1000,  // Change this
    price: 999,               // $9.99 in cents
    features: [...]
  }
};
```

### Adding New Plans

1. Add the plan to the `Plan` type in `lib/subscription.ts`
2. Add the plan limits to `PLAN_LIMITS`
3. Update the plan selection UI in `app/(pages)/plan/page.tsx`

## Monitoring

### Usage Tracking
- All import/export operations are automatically tracked
- Usage resets monthly on the 1st
- Historical usage data is preserved

### Analytics
- Track conversion from free to premium
- Monitor usage patterns
- Identify power users

## Next Steps

1. **Billing Integration**: Integrate with Shopify's billing API
2. **Email Notifications**: Send usage alerts to merchants
3. **Advanced Analytics**: Add detailed usage reporting
4. **Enterprise Plans**: Add higher-tier plans for large stores

## Testing

Test the implementation by:

1. Creating a free subscription
2. Attempting to import/export collections
3. Verifying limits are enforced
4. Testing upgrade flow

## Security Considerations

- Usage limits are enforced server-side
- Shop authentication is required for all operations
- Usage data is isolated per shop
- No sensitive data is exposed in client responses

## Support

For questions or issues with this implementation, please refer to the code comments or create an issue in your repository.
