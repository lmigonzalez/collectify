# GraphQL Types

This directory contains TypeScript types for Shopify GraphQL API.

## Current Setup

We're using **manually defined types** in `graphql.ts` because the Shopify GraphQL Codegen preset has compatibility issues with API versions.

### How to Use

```typescript
import type {
  CreateProductMutation,
  CreateProductMutationVariables,
  GetProductsQuery,
} from "@/types/graphql";

// Use with your GraphQL queries
const response = await admin.graphql<CreateProductMutation>(query, {
  variables: { input: { title: "My Product" } },
});
```

## Adding New Types

When you create new queries, add the corresponding types to `graphql.ts`:

1. Define your input types (e.g., `ProductInput`)
2. Define your response types (e.g., `ProductCreatePayload`)  
3. Define your query/mutation types (e.g., `CreateProductMutation`)

**Example:**

```typescript
// 1. Input type
export type OrderInput = {
  email: string;
  lineItems: LineItemInput[];
};

// 2. Response type
export type OrderCreatePayload = {
  order?: Order;
  userErrors: UserError[];
};

// 3. Mutation type
export type CreateOrderMutation = {
  orderCreate: OrderCreatePayload;
};
```

## Full Code Generation (Optional)

If you want automatic type generation from your GraphQL queries:

### Option 1: Using Shopify CLI

```bash
npx shopify app generate schema
```

This creates a schema file you can use with GraphQL Codegen.

### Option 2: Direct Schema Download

Save the schema from Shopify docs:
```bash
curl https://shopify.dev/admin-graphql-direct-proxy/2024-01 > types/schema.graphql
```

Then update `codegen.ts`:
```typescript
schema: "./types/schema.graphql",
documents: ["app/**/*.{ts,tsx}"],
generates: {
  "./types/generated.ts": {
    plugins: ["typescript", "typescript-operations"],
  },
},
```

Run:
```bash
npm run codegen
```

## Benefits of Current Approach

✅ **Simple** - No complex setup or schema fetching  
✅ **Reliable** - No API version compatibility issues  
✅ **Fast** - No code generation step needed  
✅ **Flexible** - Add only the types you need  
✅ **Type-safe** - Full TypeScript autocomplete and validation

## Resources

- [Shopify Admin API Docs](https://shopify.dev/api/admin-graphql)
- [GraphQL Codegen Docs](https://the-guild.dev/graphql/codegen/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

