// lib/shopify-managed-pricing.ts
// Utilities for Shopify Managed App Pricing

/**
 * Get the shop domain from the current context
 */
export function getShopDomain(): string {
  // In embedded apps, we can get the shop from the URL or headers
  if (typeof window !== 'undefined') {
    // Check if we're in an embedded app context
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    
    if (shop) {
      return shop;
    }
    
    // Fallback: try to extract from hostname
    if (window.location.hostname.includes('myshopify.com')) {
      return window.location.hostname;
    }
  }
  
  // Development fallback
  return 'dev-luiss.myshopify.com';
}

/**
 * Get the app handle from environment or configuration
 */
export function getAppHandle(): string {
  // This should match your app handle in the Partner Dashboard
  return process.env.SHOPIFY_APP_HANDLE || 'collectify';
}

/**
 * Generate the Shopify hosted pricing page URL
 */
export function getPricingPageUrl(): string {
  const shopDomain = getShopDomain();
  const appHandle = getAppHandle();
  
  // Extract store handle from shop domain
  const storeHandle = shopDomain.replace('.myshopify.com', '');
  
  return `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`;
}

/**
 * Redirect to Shopify's hosted pricing page
 */
export function redirectToPricingPage(): void {
  const pricingUrl = getPricingPageUrl();
  window.location.href = pricingUrl;
}
