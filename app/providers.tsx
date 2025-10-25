/**
 * ShopifyAppProvider integrates Shopify's Polaris React components
 * with Next.js client-side routing.
 */
export function ShopifyAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <s-app-nav>
        <s-link href="/collections/upload">Upload Collections</s-link>
        <s-link href="/collections/download">Download Collections</s-link>
        <s-link href="/collections/create">Create Collection</s-link>
        <s-link href="/plan">Plan</s-link>
      </s-app-nav>
      {children}
    </>
  );
}
