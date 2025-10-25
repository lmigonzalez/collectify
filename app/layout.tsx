import { ShopifyAppProvider } from "./providers";
import "./globals.css";
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use SHOPIFY_API_KEY from Shopify CLI
  const apiKey =
    process.env.SHOPIFY_API_KEY || process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={apiKey} />
      </head>
      <body>
        <Script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.shopify.com/shopifycloud/polaris.js"
          strategy="beforeInteractive"
        />
        <ShopifyAppProvider>{children}</ShopifyAppProvider>
      </body>
    </html>
  );
}
