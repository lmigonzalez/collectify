import { ShopifyAppProvider } from "./providers";
import Script from "next/script";
import "./globals.css";
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
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        <script src="https://cdn.shopify.com/shopifycloud/polaris.js" />
      </head>
      <body>
        <ShopifyAppProvider>{children}</ShopifyAppProvider>
      </body>
    </html>
  );
}
