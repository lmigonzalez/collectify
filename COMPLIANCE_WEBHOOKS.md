# Mandatory Compliance Webhooks - Implementation Guide

## ✅ What Was Implemented

Your Shopify app now has the three mandatory compliance webhooks required for GDPR and privacy law compliance. These webhooks are **required** for all apps distributed through the Shopify App Store.

### Webhooks Created

1. **`customers/data_request`** - `/api/webhooks/customers/data-request`
   - Handles customer data access requests
   - Triggered when a customer requests their data from the store owner

2. **`customers/redact`** - `/api/webhooks/customers/redact`
   - Handles customer data deletion requests
   - Triggered when a store owner requests deletion of customer data

3. **`shop/redact`** - `/api/webhooks/shop/redact`
   - Handles shop data deletion after app uninstall
   - Triggered 48 hours after a store owner uninstalls your app

## 🔐 Security Features

All webhook handlers include:
- ✅ HMAC signature verification (prevents webhook spoofing)
- ✅ Proper error handling
- ✅ 401 Unauthorized response for invalid signatures
- ✅ 200 OK responses to acknowledge receipt

## 📋 Configuration

The webhooks have been configured in `shopify.app.toml`:

```toml
[[webhooks.subscriptions]]
compliance_topics = ["customers/data_request"]
uri = "/api/webhooks/customers/data-request"

[[webhooks.subscriptions]]
compliance_topics = ["customers/redact"]
uri = "/api/webhooks/customers/redact"

[[webhooks.subscriptions]]
compliance_topics = ["shop/redact"]
uri = "/api/webhooks/shop/redact"
```

## 🚀 Next Steps

### 1. Deploy and Register Webhooks

After deploying your app, you need to register the webhooks with Shopify:

```bash
# Deploy your app
shopify app deploy

# Or for development/testing
shopify app dev
```

The webhooks will be automatically registered during the OAuth callback when a merchant installs your app.

### 2. Implement Data Handling Logic

The webhook handlers are set up with placeholders. You need to implement the actual data handling:

#### For `customers/data_request`:
```typescript
// In /app/api/webhooks/customers/data-request/route.ts

// 1. Query your database for all customer data
const customerData = await prisma.yourTable.findMany({
  where: {
    shop_domain: payload.shop_domain,
    customer_id: payload.customer.id
  }
});

// 2. Compile data into readable format (JSON, CSV, or PDF)
// 3. Send directly to store owner via email
// 4. Complete within 30 days
```

#### For `customers/redact`:
```typescript
// In /app/api/webhooks/customers/redact/route.ts

// Delete all customer-related data
await prisma.customerData.deleteMany({
  where: {
    shop_domain: payload.shop_domain,
    customer_id: payload.customer.id
  }
});

// Complete within 30 days
```

#### For `shop/redact`:
```typescript
// In /app/api/webhooks/shop/redact/route.ts

// Delete ALL shop-related data
await prisma.session.deleteMany({
  where: { shop: payload.shop_domain }
});

await prisma.subscription.deleteMany({
  where: { shop: payload.shop_domain }
});

// Delete any other shop-specific data
```

### 3. Test the Webhooks

You can test your webhooks using the Shopify CLI:

```bash
# Test customer data request
shopify app webhook trigger --topic=customers/data_request \
  --address=/api/webhooks/customers/data-request

# Test customer redact
shopify app webhook trigger --topic=customers/redact \
  --address=/api/webhooks/customers/redact

# Test shop redact
shopify app webhook trigger --topic=shop/redact \
  --address=/api/webhooks/shop/redact
```

### 4. Monitor Webhook Activity

Check your logs to ensure webhooks are being received and processed:

```bash
# Look for these log messages:
# ✅ "Customer data request received"
# ✅ "Customer redact request received"
# ✅ "Shop redact request received"
```

### 5. Verify Webhook Registration

After installation, verify webhooks are registered in your Shopify Partner Dashboard:
1. Go to **Apps** → Your App → **API credentials**
2. Scroll to **Webhooks**
3. Confirm all three compliance webhooks are listed

## ⚠️ Important Compliance Notes

### Data Retention Requirements

1. **Customer Data Requests** (`customers/data_request`)
   - Respond within **30 days**
   - Provide ALL data you've collected about the customer
   - Send directly to the store owner

2. **Customer Data Deletion** (`customers/redact`)
   - Complete deletion within **30 days**
   - Delete or anonymize all personal data
   - Exception: Data legally required to retain (e.g., tax records)

3. **Shop Data Deletion** (`shop/redact`)
   - Triggered **48 hours** after app uninstall
   - Delete ALL shop-related data
   - Exception: Anonymized aggregate analytics (if unlinkable to shop)

### What Must Be Deleted

When processing redaction requests, delete:
- ✅ Customer/shop identifiable information
- ✅ Email addresses and contact details
- ✅ Order data (unless legally required to retain)
- ✅ Analytics containing personal data
- ✅ Logs containing personal information
- ✅ Access tokens and sessions

### What Can Be Retained

You may keep:
- ✅ Anonymized aggregate statistics
- ✅ Data legally required to retain (properly documented)
- ✅ Data with all personal identifiers removed

## 🔍 Troubleshooting

### Webhook Not Receiving Requests

1. Check that your app URL is publicly accessible (not localhost)
2. Verify SSL certificate is valid
3. Check Shopify Partner Dashboard for webhook delivery logs
4. Ensure HMAC verification is correct

### 401 Unauthorized Errors

```bash
# Check your environment variable
echo $SHOPIFY_API_SECRET

# Make sure it matches your Partner Dashboard API secret
```

### Webhook Timing

- `customers/redact`: Sent 10 days after request (if no recent orders) or 6 months after last order
- `shop/redact`: Sent 48 hours after app uninstall

## 📚 Additional Resources

- [Shopify Privacy Compliance Docs](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [GDPR Compliance Guide](https://www.shopify.com/partners/blog/gdpr)
- [Webhook Verification Guide](https://shopify.dev/docs/apps/build/webhooks/subscribe/https)

## ✅ Checklist for App Store Submission

Before submitting your app to the Shopify App Store:

- [ ] All three compliance webhooks are implemented
- [ ] HMAC signature verification is working
- [ ] Data handling logic is implemented (not just placeholders)
- [ ] Webhooks return proper status codes (200 for success, 401 for invalid HMAC)
- [ ] Tested using `shopify app webhook trigger`
- [ ] Verified webhooks are registered in Partner Dashboard
- [ ] Documented your data retention policies
- [ ] Created a privacy policy for your app

---

## 📝 Notes

The current implementation includes:
- ✅ Webhook endpoint structure
- ✅ HMAC verification
- ✅ Proper error handling
- ✅ Logging for monitoring
- ⚠️ Placeholder data handling (YOU MUST IMPLEMENT)

Make sure to implement the actual data collection, deletion, and notification logic before submitting your app for review!

