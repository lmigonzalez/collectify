# Deployment Guide - Database Migrations

## ✅ What Was Fixed

### Critical Issues Resolved:
1. **Migrations were being ignored by git** - Fixed `.gitignore` to include migrations
2. **No migration script on build** - Updated `build` script to run `prisma migrate deploy`
3. **Database was missing `shopifySubscriptionId` column** - Applied migration locally

## 📋 Changes Made

### 1. `.gitignore` Updated
- ❌ Before: `prisma/migrations/` was ignored (migrations wouldn't deploy)
- ✅ After: Migrations are now tracked in git and will be deployed

### 2. `package.json` Updated
Added migration deployment to the build process:
```json
"build": "prisma migrate deploy && next build --turbopack"
```

Also added a dedicated migration script:
```json
"prisma:deploy": "prisma migrate deploy"
```

### 3. Migrations Staged for Commit
The following files are ready to commit:
- `prisma/migrations/20251108224635_/migration.sql` (initial schema)
- `prisma/migrations/20251109202501_add_shopify_subscription_id/migration.sql` (adds shopifySubscriptionId)
- `prisma/migrations/migration_lock.toml`
- `.gitignore` (updated)
- `package.json` (updated)

## 🚀 Deployment Steps

### Step 1: Commit and Push Changes
```bash
git commit -m "fix: add database migrations and deployment config"
git push origin main
```

### Step 2: Deploy Your App

#### Option A: Shopify CLI Deployment
```bash
shopify app deploy
```

#### Option B: Manual Deployment (Railway, Heroku, etc.)
Your hosting platform will automatically:
1. Install dependencies (`npm install`)
2. Run `postinstall` → generates Prisma client
3. Run `build` → runs migrations + builds Next.js
4. Start the app

### Step 3: Verify Deployment
After deployment, check your logs to confirm:
- ✅ Migrations were applied: "All migrations have been successfully applied"
- ✅ Build completed successfully
- ✅ App is running without database errors

## 🔍 How It Works Now

### During Build (Automatic):
1. `npm install` → installs dependencies
2. `postinstall` hook → runs `prisma generate`
3. `npm run build` → runs `prisma migrate deploy` then `next build`

### On First Request (Automatic):
- If database schema is missing, fallback handling prevents crashes
- Subscriptions will be created with free plan as default

## 🛠️ Manual Migration Commands

If you need to run migrations manually on your production database:

```bash
# Deploy all pending migrations
npm run prisma:deploy

# Or directly
npx prisma migrate deploy
```

## 📊 Database Schema

Your database now has these tables:
- `Session` - Shopify session storage
- `subscriptions` - Subscription plans and status (includes `shopifySubscriptionId`)
- `usage` - Monthly usage tracking
- `usage_limits` - Plan limits configuration

## ⚠️ Important Notes

### Environment Variables Required:
Ensure your deployment has:
- `DATABASE_URL` - PostgreSQL connection string
- `SHOPIFY_API_KEY` - Your Shopify app API key
- `SHOPIFY_API_SECRET` - Your Shopify app secret
- Other required env vars from your `.env` file

### Migration Safety:
- `prisma migrate deploy` only runs pending migrations
- It will NOT reset or drop existing data
- Safe to run multiple times (idempotent)

### If Deployment Fails:
1. Check deployment logs for specific error
2. Verify `DATABASE_URL` is accessible from deployment environment
3. Ensure all environment variables are set
4. Check that migrations are included in your git repository

## 🔄 Future Migrations

When you create new migrations:

### Development:
```bash
npm run prisma:migrate  # Creates new migration
```

### Deployment:
1. Commit the new migration file to git
2. Push to your repository
3. Deploy - migrations run automatically during build

## ✨ Testing Your Deployment

After deployment, test:
1. Visit `/collections/download` - should load without database errors
2. Check usage tracking in `/` or wherever UsageDashboard is displayed
3. Verify subscription status is showing correctly

## 📚 Additional Resources

- [Prisma Deploy Docs](https://www.prisma.io/docs/guides/deployment)
- [Shopify App Deployment](https://shopify.dev/docs/apps/deployment)
- [Database Migration Best Practices](https://www.prisma.io/docs/guides/migrate)

---

**Last Updated:** November 20, 2025
**Status:** ✅ Ready for Deployment

