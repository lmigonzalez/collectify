# Shopify Managed App Pricing Setup Guide

This guide will help you set up Shopify's Managed App Pricing for your Collectify app.

## 🎯 **What is Managed App Pricing?**

Managed App Pricing lets Shopify handle all subscription management for you:
- ✅ Shopify hosts your plan selection page
- ✅ Automatic payment processing
- ✅ Subscription management
- ✅ Proration and billing cycles
- ✅ Trial periods
- ✅ Discounts and refunds
- ✅ No need to code billing logic

## 📋 **Step-by-Step Setup**

### **Step 1: Enable Managed Pricing in Partner Dashboard**

1. **Go to Partner Dashboard**
   - Visit [partners.shopify.com](https://partners.shopify.com)
   - Click **Apps > All Apps**
   - Click on your **Collectify** app

2. **Navigate to Pricing Settings**
   - Click **Distribution**
   - Beside **Shopify App Store listing**, click **Manage listing**
   - Under **Published languages**, click **Edit** for English
   - Under **Pricing content**, click **Manage**

3. **Switch to Managed Pricing**
   - Click **Settings**
   - Select **Managed pricing**
   - In the confirmation dialog, click **Switch**

### **Step 2: Create Your Plans**

You need to create 3 plans matching your requirements:

#### **Plan 1: Free Plan**
- **Billing**: Free
- **Display Name**: "Free Plan"
- **Top Features**:
  - Basic collection management
  - Up to 100 collections per month
  - CSV import/export (100 collections/month)
  - Basic support

#### **Plan 2: Pro Plan (Monthly)**
- **Billing**: Monthly
- **Monthly Charge**: $10.00
- **Display Name**: "Pro Plan (Monthly)"
- **Top Features**:
  - Everything in Free Plan
  - Unlimited collections per month
  - Batch processing (1000 collections per batch)
  - Priority support
  - Advanced analytics
  - API access

#### **Plan 3: Pro Plan (Yearly)**
- **Billing**: Yearly
- **Yearly Charge**: $100.00
- **Display Name**: "Pro Plan (Yearly)"
- **Top Features**:
  - Everything in Pro Monthly
  - 17% savings vs monthly billing
  - Same features as monthly plan

### **Step 3: Configure Welcome Links**

For each plan, set the **Welcome link** to:
```
/collections
```

This will redirect users back to your collections page after they approve the subscription.

### **Step 4: Test Your Setup**

1. **Development Testing**
   - Install your app on a development store
   - Visit your app's plan page
   - Click any plan button
   - You should be redirected to: `https://admin.shopify.com/store/{store_handle}/charges/{app_handle}/pricing_plans`

2. **Verify Plan Selection**
   - The Shopify hosted page should show your 3 plans
   - Test selecting each plan
   - Verify the welcome link redirects back to `/collections`

## 🔧 **App Configuration**

### **Environment Variables**

Add this to your `.env` file:
```bash
SHOPIFY_APP_HANDLE=collectify
```

### **App Handle**

Your app handle should match what you set in the Partner Dashboard. This is used to construct the pricing page URL.

## 📱 **How It Works**

### **User Flow**
1. User visits `/plan` in your app
2. User clicks any plan button
3. User is redirected to Shopify's hosted pricing page
4. User selects and approves a plan
5. User is redirected back to `/collections` (your welcome link)
6. Your app can check subscription status via API

### **URL Pattern**
```
https://admin.shopify.com/store/{store_handle}/charges/{app_handle}/pricing_plans
```

Where:
- `{store_handle}` = the store's handle (e.g., "dev-luiss")
- `{app_handle}` = your app's handle (e.g., "collectify")

## 🔍 **Checking Subscription Status**

Your app can still check subscription status using the existing API:

```typescript
// Check if user has active subscription
const response = await fetch("/api/subscriptions/status");
const data = await response.json();

if (data.hasActiveSubscription) {
  console.log("User has active subscription:", data.subscription);
}
```

## 🎨 **UI Updates Made**

### **Plan Page Changes**
- ✅ Removed manual subscription creation
- ✅ All buttons now redirect to Shopify's hosted page
- ✅ Simplified button states (no more "Processing..." state)
- ✅ Updated messaging to reflect managed pricing

### **Code Changes**
- ✅ Created `lib/shopify-managed-pricing.ts` utility
- ✅ Removed `app/api/subscriptions/create/route.ts`
- ✅ Updated plan page to use managed pricing redirect

## 🚀 **Benefits of Managed Pricing**

1. **Simplified Development**
   - No need to handle payment processing
   - No need to manage subscription states
   - No need to handle billing errors

2. **Better User Experience**
   - Consistent Shopify UI
   - Trusted payment flow
   - Automatic proration

3. **Reduced Maintenance**
   - Shopify handles all billing logic
   - Automatic updates and improvements
   - Built-in security and compliance

## 🔧 **Troubleshooting**

### **Common Issues**

1. **404 Error on Pricing Page**
   - Check that your app handle is correct
   - Ensure managed pricing is enabled
   - Verify the store has the app installed

2. **Plans Not Showing**
   - Check that plans are published in Partner Dashboard
   - Verify plan descriptions are added for the current language
   - Ensure plans are not set to private

3. **Welcome Link Not Working**
   - Check that the welcome link is a valid path
   - Ensure the path exists in your app
   - Test the redirect manually

### **Testing Tips**

1. **Use Development Stores**
   - Test subscriptions are free on dev stores
   - No real charges are processed

2. **Check Partner Dashboard**
   - Monitor subscription status
   - View billing history
   - Test discount and trial extensions

## 📚 **Next Steps**

1. **Set up managed pricing in Partner Dashboard** (follow steps above)
2. **Test the flow** with a development store
3. **Monitor subscription status** in your app
4. **Set up webhooks** for subscription updates (optional)

## 🎉 **You're All Set!**

With managed pricing, Shopify handles all the complex billing logic for you. Your users get a seamless, trusted experience, and you get to focus on building great features instead of managing payments!
