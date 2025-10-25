// lib/shopify.ts
// Core Shopify API configuration for Next.js

import "@shopify/shopify-api/adapters/node";
import { shopifyApi, Session, ApiVersion } from "@shopify/shopify-api";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db";

// Initialize Shopify API with your app credentials
const shopify = shopifyApi({
  // Your app credentials from Shopify Partner Dashboard
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,

  // Scopes your app needs (e.g., 'write_products,read_orders')
  scopes: (
    process.env.SHOPIFY_SCOPES ||
    process.env.SCOPES ||
    "write_products,read_products,read_product_listings"
  )
    .split(",")
    .filter((scope) => scope.trim() !== ""),

  // Your app URL (without https://)
  hostName: (
    process.env.SHOPIFY_APP_URL ||
    process.env.HOST ||
    "drums-feeling-camera-deviation.trycloudflare.com"
  ).replace(/https?:\/\//, ""),
  hostScheme: "https",

  // API version
  apiVersion: ApiVersion.October25,

  // Embedded in Shopify admin
  isEmbeddedApp: true,

  // Session storage - THIS IS CRITICAL FOR TOKEN MANAGEMENT
  // Tokens are stored in database via Prisma
  sessionStorage: new PrismaSessionStorage(prisma),
});

export default shopify;

/**
 * HOW TOKEN STORAGE WORKS:
 *
 * 1. During OAuth, Shopify gives us an access token
 * 2. shopifyApi.auth.callback() automatically stores it via PrismaSessionStorage
 * 3. The token is saved in the Session table with the shop domain
 * 4. Later, we retrieve sessions by shop domain to get the token
 * 5. Use the token to make authenticated API calls
 *
 * Session table contains:
 * - id: Unique identifier
 * - shop: Store domain (e.g., 'mystore.myshopify.com')
 * - accessToken: THE CRITICAL TOKEN for API calls
 * - scope: Permissions granted
 * - expires: Token expiration (null for offline tokens)
 * - isOnline: false for offline (long-lived), true for online
 */
