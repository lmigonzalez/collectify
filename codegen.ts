import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * GraphQL Codegen Configuration for Shopify
 *
 * SETUP INSTRUCTIONS:
 * ===================
 *
 * The Shopify API codegen preset has issues with API versions.
 * Here's the recommended approach:
 *
 * OPTION 1 - Manual Types (Current Setup):
 * - We've created basic types in ./types/graphql.ts
 * - Add more types as needed for your queries
 * - Simpler and more reliable
 *
 * OPTION 2 - Full Codegen (Advanced):
 * 1. First, get the schema using Shopify CLI:
 *    shopify app generate schema
 *
 * 2. Then update this config to use that schema file
 *
 * OPTION 3 - Use without full types:
 * - Just use TypeScript generics with your queries
 * - Example: const response = await admin.graphql<MyQueryResponse>(query)
 */

const config: CodegenConfig = {
  overwrite: true,
  generates: {},
  // Uncomment and configure after getting schema from Shopify CLI
  // schema: "./schema.graphql",
  // documents: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
  // generates: {
  //   "./types/graphql.ts": {
  //     plugins: ["typescript", "typescript-operations"],
  //   },
  // },
};

export default config;
