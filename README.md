# Complete Shopify App Boilerplate Guide

A comprehensive guide to understanding and building with this Next.js Shopify App boilerplate.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Authentication & Token Management](#authentication--token-management)
- [Polaris Web Components](#polaris-web-components)
- [Navigation](#navigation)
- [API Routes & Data Fetching](#api-routes--data-fetching)
- [Database Schema](#database-schema)
- [GraphQL Integration](#graphql-integration)
- [Project Structure](#project-structure)
- [Common Patterns](#common-patterns)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

This boilerplate provides a production-ready foundation for building Shopify embedded apps using:

- **Next.js 15** - App Router with React Server Components
- **Shopify API v12** - Latest Shopify API with GraphQL
- **Prisma** - Type-safe database access
- **App Bridge** - Embedded app framework
- **TypeScript** - Full type safety
- **Tailwind CSS** - Modern styling

### Key Features

✅ OAuth authentication with token storage  
✅ Session management (database-backed)  
✅ JWT token validation  
✅ GraphQL API integration with type safety  
✅ Polaris web components  
✅ Client-side navigation  
✅ Token exchange for seamless auth  

---

## Architecture

### High-Level Flow

```
┌─────────────────┐
│  Shopify Admin  │
│   (iframe)      │
└────────┬────────┘
         │
         │ Embeds your app
         ↓
┌─────────────────────────────────┐
│      Your Next.js App           │
│  ┌──────────────────────────┐  │
│  │   Frontend (React)       │  │
│  │   - Polaris Components   │  │
│  │   - App Bridge           │  │
│  └───────────┬──────────────┘  │
│              │                  │
│              │ JWT Token        │
│              ↓                  │
│  ┌──────────────────────────┐  │
│  │   Backend (API Routes)   │  │
│  │   - Decode JWT           │  │
│  │   - Load Session         │  │
│  │   - Get Access Token     │  │
│  └───────────┬──────────────┘  │
└──────────────┼──────────────────┘
               │
               │ Access Token
               ↓
        ┌─────────────┐
        │ Shopify API │
        └─────────────┘
```

### Data Flow

1. **Frontend** gets JWT from App Bridge
2. **Frontend** sends JWT to API route
3. **API Route** decodes JWT to get shop domain
4. **API Route** loads session from database
5. **API Route** uses access token from session
6. **API Route** calls Shopify API
7. **API Route** returns response to frontend

---

## Authentication & Token Management

### Two Types of Tokens

#### 1. Access Token (Long-lived, Server-side)

| Property | Value |
|----------|-------|
| **What** | OAuth token from Shopify |
| **Format** | `shpat_abc123...` |
| **Stored** | Database (Session table) |
| **Lifetime** | Permanent (until revoked) |
| **Used for** | Making Shopify API calls |
| **Exposed** | ❌ NEVER to frontend |

#### 2. Session Token (Short-lived, Client-side)

| Property | Value |
|----------|-------|
| **What** | JWT from App Bridge |
| **Format** | `eyJhbGci...` |
| **Stored** | App Bridge (automatic) |
| **Lifetime** | ~1 minute (refreshed automatically) |
| **Used for** | Identifying shop in requests |
| **Exposed** | ✅ Yes (safe, signed by Shopify) |

### OAuth Flow (First Installation)

```
1. User clicks "Install App"
   ↓
2. Shopify redirects to: /api/auth?shop=example.myshopify.com
   ↓
3. Backend redirects to Shopify OAuth page
   ↓
4. User approves permissions
   ↓
5. Shopify redirects to: /api/auth/callback?code=AUTH_CODE
   ↓
6. Backend exchanges code for access token
   ↓
7. Access token saved to database
   ↓
8. User redirected to app
```

### OAuth Implementation

#### Step 1: Initiate OAuth (`app/api/auth/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  
  // Sanitize shop domain
  const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
  
  // Begin OAuth process
  const authRoute = await shopify.auth.begin({
    shop: sanitizedShop,
    callbackPath: '/api/auth/callback',
    isOnline: false, // Use offline tokens
    rawRequest: request,
    rawResponse: NextResponse,
  });
  
  return NextResponse.redirect(authRoute);
}
```

**What happens:**
- Validates shop domain
- Creates OAuth URL with your app credentials
- Redirects to Shopify's permission request page

#### Step 2: Handle Callback (`app/api/auth/callback/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  // Complete OAuth process
  const callback = await shopify.auth.callback({
    rawRequest: request,
    rawResponse: NextResponse,
  });
  
  const { session } = callback;
  
  // At this point:
  // - session.accessToken contains the token
  // - session.shop contains the store domain
  // - The session has been saved to database automatically
  
  // Optional: Register webhooks
  await shopify.webhooks.register({ session });
  
  // Redirect to app
  const host = Buffer.from(`${session.shop}/admin`).toString('base64');
  return NextResponse.redirect(`${process.env.SHOPIFY_APP_URL}?shop=${session.shop}&host=${host}`);
}
```

**What happens:**
- Validates callback parameters (HMAC, state)
- Exchanges authorization code for access token
- Saves session to database (via PrismaSessionStorage)
- Redirects user to app

### Token Exchange (Subsequent Requests)

For embedded apps, you can use **token exchange** to get/refresh access tokens without full OAuth:

```typescript
// In authenticate.ts
const { session: newSession } = await shopify.auth.tokenExchange({
  shop,
  sessionToken, // JWT from App Bridge
  requestedTokenType: RequestedTokenType.OfflineAccessToken,
});

// Store session
await shopify.config.sessionStorage.storeSession(newSession);
```

**Benefits:**
- No redirect to OAuth page
- Seamless user experience
- Automatically handles expired tokens

### Retrieving Sessions

#### Method 1: From JWT Token (Embedded Apps)

```typescript
export async function getSessionFromToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader.replace("Bearer ", "");
  
  // Decode JWT (signed by Shopify)
  const payload = await shopify.session.decodeSessionToken(token);
  
  // Extract shop domain
  const shop = payload.dest.replace("https://", "");
  
  // Create session ID
  const sessionId = shopify.session.getOfflineId(shop);
  
  // Load session from database
  const session = await shopify.config.sessionStorage.loadSession(sessionId);
  
  return session;
}
```

#### Method 2: From Cookies (Non-embedded)

```typescript
export async function authenticateAdmin(request: NextRequest) {
  // Get session ID from cookies
  const sessionId = await shopify.session.getCurrentId({
    isOnline: false,
    rawRequest: request,
  });
  
  // Load session from database
  const session = await shopify.config.sessionStorage.loadSession(sessionId);
  
  return session;
}
```

### Complete Authentication Function

The boilerplate provides a unified `authenticate()` function that:
1. Extracts JWT from Authorization header
2. Decodes JWT to get shop domain
3. Loads session from database
4. Uses token exchange if no session exists
5. Returns session and GraphQL client

```typescript
const { session, admin } = await authenticate(request);

// session.accessToken - the OAuth token
// session.shop - the store domain
// admin.graphql() - GraphQL client with token
```

---

## Polaris Web Components

This boilerplate uses **Shopify Polaris Web Components** (not React components). These are custom HTML elements that work with any framework.

### Setup

#### 1. Include Scripts (`app/layout.tsx`)

```typescript
<head>
  <meta name="shopify-api-key" content={apiKey} />
  <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
  <script src="https://cdn.shopify.com/shopifycloud/polaris.js"></script>
</head>
```

#### 2. Wrap with Provider (`app/providers.tsx`)

```typescript
<ShopifyAppProvider>{children}</ShopifyAppProvider>
```

### Available Components

#### Layout Components

```jsx
// Page container
<s-page heading="My Page Title">
  {/* Page content */}
</s-page>

// Stack (vertical/horizontal layout)
<s-stack direction="block" gap="large" padding="large">
  <s-box>First item</s-box>
  <s-box>Second item</s-box>
</s-stack>

// Box (container with styling)
<s-box 
  padding="large" 
  background="base" 
  border="base" 
  borderRadius="large"
>
  Content
</s-box>
```

#### Typography

```jsx
// Heading
<s-heading>Section Title</s-heading>

// Text
<s-text>Normal text</s-text>
<s-text type="strong">Bold text</s-text>
<s-text color="subdued">Muted text</s-text>

// Paragraph
<s-paragraph color="subdued">
  Description text
</s-paragraph>
```

#### Buttons

```jsx
// Primary button
<s-button 
  slot="primary-action"
  onClick={handleClick}
  disabled={loading}
  loading={loading}
>
  Create Product
</s-button>

// Button group
<s-button-group>
  <s-button slot="primary-action">Save</s-button>
  <s-button slot="secondary-actions">Cancel</s-button>
</s-button-group>
```

#### Lists

```jsx
// Ordered list
<s-ordered-list>
  <li><s-text>First item</s-text></li>
  <li><s-text>Second item</s-text></li>
</s-ordered-list>

// Unordered list
<s-unordered-list>
  <li><s-text>Bullet item</s-text></li>
</s-unordered-list>
```

#### Feedback

```jsx
// Banner
<s-banner tone="success" heading="Success!">
  <s-text>Operation completed successfully</s-text>
</s-banner>

<s-banner tone="critical" heading="Error">
  <s-text>Something went wrong</s-text>
</s-banner>

<s-banner tone="info" heading="Info">
  <s-text>Helpful information</s-text>
</s-banner>

// Toast (via App Bridge)
const shopify = useAppBridge();
shopify.toast.show("Product created!");
shopify.toast.show("Error occurred", { isError: true });
```

#### Forms

```jsx
<s-form onSubmit={handleSubmit}>
  <s-text-field 
    label="Title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
  />
  
  <s-select 
    label="Status"
    options={[
      { label: 'Active', value: 'active' },
      { label: 'Draft', value: 'draft' }
    ]}
  />
  
  <s-checkbox 
    label="Published"
    checked={published}
  />
  
  <s-button type="submit">Submit</s-button>
</s-form>
```

### Using App Bridge

App Bridge provides JavaScript APIs for embedded app functionality:

```typescript
"use client";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function MyComponent() {
  const shopify = useAppBridge();
  
  // Get session token (JWT)
  const token = await shopify.idToken();
  
  // Show toast notification
  shopify.toast.show("Success!");
  shopify.toast.show("Error!", { isError: true });
  
  // Navigate to admin pages
  shopify.navigate("shopify://admin/products");
  
  // Open modal
  shopify.modal.show("my-modal");
  
  // Save bar (for save/discard)
  shopify.saveBar.show("my-save-bar");
  shopify.saveBar.hide("my-save-bar");
  
  return <div>My Component</div>;
}
```

### Type Definitions

The boilerplate includes TypeScript definitions for web components:

```typescript
// types/shopify-components.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    's-page': any;
    's-stack': any;
    's-box': any;
    's-button': any;
    // ... more components
  }
}
```

---

## Navigation

The boilerplate integrates Shopify's `<s-app-nav>` with Next.js client-side routing for a seamless experience.

### How It Works

#### 1. Navigation Component (`app/providers.tsx`)

```typescript
export function ShopifyAppProvider({ children }) {
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Get all s-link elements
    const links = navRef.current?.querySelectorAll("s-link");
    
    const handleLinkClick = (e: Event) => {
      const link = e.currentTarget as HTMLElement;
      const href = link.getAttribute("href");
      
      // Intercept internal links
      if (href && href.startsWith("/")) {
        e.preventDefault();
        router.push(href); // Use Next.js router
      }
    };
    
    // Attach click handlers
    links?.forEach((link) => {
      link.addEventListener("click", handleLinkClick);
    });
    
    return () => {
      links?.forEach((link) => {
        link.removeEventListener("click", handleLinkClick);
      });
    };
  }, [router]);
  
  return (
    <>
      <div ref={navRef}>
        <s-app-nav>
          <s-link href="/" rel="home">Home</s-link>
          <s-link href="/plan">Plan</s-link>
        </s-app-nav>
      </div>
      {children}
    </>
  );
}
```

**Key points:**
- Intercepts clicks on `<s-link>` elements
- Uses Next.js `router.push()` for client-side navigation
- Prevents full page reloads
- Maintains embedded app context

#### 2. Adding Routes

Create new pages in `app/(pages)/`:

```typescript
// app/(pages)/settings/page.tsx
"use client";

export default function SettingsPage() {
  return (
    <s-page heading="Settings">
      <s-text>Settings content</s-text>
    </s-page>
  );
}
```

Add to navigation:

```typescript
<s-app-nav>
  <s-link href="/" rel="home">Home</s-link>
  <s-link href="/plan">Plan</s-link>
  <s-link href="/settings">Settings</s-link>
</s-app-nav>
```

#### 3. Programmatic Navigation

```typescript
"use client";
import { useRouter } from "next/navigation";

export default function MyComponent() {
  const router = useRouter();
  
  const goToSettings = () => {
    router.push("/settings");
  };
  
  return <s-button onClick={goToSettings}>Go to Settings</s-button>;
}
```

#### 4. External Links

For external links or Shopify admin pages:

```typescript
import { useAppBridge } from "@shopify/app-bridge-react";

export default function MyComponent() {
  const shopify = useAppBridge();
  
  const openProducts = () => {
    shopify.navigate("shopify://admin/products");
  };
  
  return <s-button onClick={openProducts}>View Products</s-button>;
}
```

---

## API Routes & Data Fetching

### Creating API Routes

#### Basic Structure

```typescript
// app/api/your-route/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const { session, admin } = await authenticate(request);
    
    // Get request body
    const body = await request.json();
    
    // Make GraphQL query
    const response = await admin.graphql(`
      query {
        shop {
          name
          email
        }
      }
    `);
    
    const data = await response.json();
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Similar structure for GET requests
}
```

### Making API Calls from Frontend

#### Pattern 1: Using App Bridge Token

```typescript
"use client";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";

export default function MyComponent() {
  const shopify = useAppBridge();
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Get JWT token from App Bridge
      const sessionToken = await shopify.idToken();
      
      // Make request with token
      const response = await fetch("/api/your-route", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "value"
        }),
      });
      
      if (!response.ok) {
        throw new Error("Request failed");
      }
      
      const data = await response.json();
      console.log(data);
      
      // Show success toast
      shopify.toast.show("Success!");
    } catch (error) {
      console.error(error);
      shopify.toast.show("Error occurred", { isError: true });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <s-button onClick={fetchData} loading={loading}>
      Fetch Data
    </s-button>
  );
}
```

#### Pattern 2: Custom Hook

```typescript
// hooks/useAuthenticatedFetch.ts
import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback } from "react";

export function useAuthenticatedFetch() {
  const shopify = useAppBridge();
  
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await shopify.idToken();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    [shopify]
  );
  
  return authenticatedFetch;
}

// Usage
const authenticatedFetch = useAuthenticatedFetch();
const data = await authenticatedFetch("/api/products", {
  method: "POST",
  body: JSON.stringify({ title: "New Product" }),
});
```

### Example: Product Creation

#### API Route (`app/api/products/create/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";
import type { CreateProductMutation } from "@/types/graphql";

export async function POST(request: NextRequest) {
  try {
    const { session, admin } = await authenticate(request);
    const body = await request.json();
    
    const response = await admin.graphql<CreateProductMutation>(
      `#graphql
        mutation createProduct($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              handle
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          input: {
            title: body.title,
            descriptionHtml: body.description,
          },
        },
      }
    );
    
    const data = await response.json();
    
    if (data.data?.productCreate?.userErrors?.length > 0) {
      return NextResponse.json(
        { error: data.data.productCreate.userErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      product: data.data.productCreate.product,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
```

#### Frontend Component

```typescript
"use client";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";

export default function CreateProduct() {
  const shopify = useAppBridge();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  
  const createProduct = async () => {
    setLoading(true);
    try {
      const token = await shopify.idToken();
      
      const response = await fetch("/api/products/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: "<p>Product description</p>",
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        shopify.toast.show("Product created!");
        setTitle("");
      }
    } catch (error) {
      shopify.toast.show("Error", { isError: true });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <s-stack direction="block" gap="base">
      <s-text-field
        label="Product Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <s-button onClick={createProduct} loading={loading}>
        Create Product
      </s-button>
    </s-stack>
  );
}
```

---

## Database Schema

### Session Table

The `Session` table stores OAuth tokens and shop information:

```prisma
model Session {
  id            String    @id
  shop          String
  state         String
  isOnline      Boolean   @default(false)
  scope         String?
  expires       DateTime?
  accessToken   String
  userId        BigInt?
  firstName     String?
  lastName      String?
  email         String?
  accountOwner  Boolean   @default(false)
  locale        String?
  collaborator  Boolean?  @default(false)
  emailVerified Boolean?  @default(false)
}
```

#### Key Fields

| Field | Description |
|-------|-------------|
| `id` | Session identifier (e.g., "offline_store.myshopify.com") |
| `shop` | Store domain (e.g., "store.myshopify.com") |
| `accessToken` | **THE OAUTH TOKEN** - used for API calls |
| `scope` | Granted permissions (e.g., "write_products,read_orders") |
| `isOnline` | false = offline token (permanent), true = online token (expires) |
| `expires` | Expiration date (null for offline tokens) |
| `state` | OAuth state parameter |
| `userId` | Shopify user ID (for online sessions) |

### Prisma Commands

```bash
# Generate Prisma client (after schema changes)
npm run prisma:generate

# Create migration (after schema changes)
npm run prisma:migrate

# View database in GUI
npm run prisma:studio

# Reset database (⚠️ deletes all data)
npm run prisma:reset
```

### Adding Custom Tables

1. Edit `prisma/schema.prisma`:

```prisma
model Product {
  id          String   @id @default(uuid())
  shopifyId   String   @unique
  shop        String
  title       String
  handle      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

2. Create migration:

```bash
npm run prisma:migrate
```

3. Use in your code:

```typescript
import prisma from "@/lib/db";

// Create
const product = await prisma.product.create({
  data: {
    shopifyId: "gid://shopify/Product/123",
    shop: "store.myshopify.com",
    title: "My Product",
    handle: "my-product",
  },
});

// Find
const product = await prisma.product.findUnique({
  where: { shopifyId: "gid://shopify/Product/123" },
});

// Update
await prisma.product.update({
  where: { id: product.id },
  data: { title: "Updated Title" },
});

// Delete
await prisma.product.delete({
  where: { id: product.id },
});
```

---

## GraphQL Integration

### Type-Safe GraphQL

The boilerplate supports type-safe GraphQL queries using TypeScript:

#### 1. Define Types (`types/graphql.ts`)

```typescript
export type CreateProductMutation = {
  productCreate: {
    product: {
      id: string;
      title: string;
      handle: string;
      status: string;
    } | null;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
};

export type CreateProductMutationVariables = {
  input: {
    title: string;
    descriptionHtml?: string;
    vendor?: string;
    productType?: string;
  };
};
```

#### 2. Use in API Routes

```typescript
const response = await admin.graphql<CreateProductMutation>(
  `#graphql
    mutation createProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
  {
    variables: {
      title: "Product Name",
      descriptionHtml: "<p>Description</p>",
    } as CreateProductMutationVariables,
  }
);

const data = await response.json();
// data.data is now type-safe!
const product = data.data.productCreate.product;
```

### GraphQL Code Generation

For automatic type generation:

#### 1. Get Schema from Shopify

```bash
npx shopify app generate schema
```

This creates a `schema.graphql` file.

#### 2. Configure Codegen (`codegen.ts`)

```typescript
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "./schema.graphql",
  documents: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
  generates: {
    "./types/graphql.ts": {
      plugins: ["typescript", "typescript-operations"],
    },
  },
};

export default config;
```

#### 3. Run Codegen

```bash
npm run codegen
```

This generates TypeScript types from your GraphQL queries.

### Common GraphQL Queries

#### Get Products

```graphql
query getProducts($first: Int!) {
  products(first: $first) {
    edges {
      node {
        id
        title
        handle
        status
        variants(first: 5) {
          edges {
            node {
              id
              price
              inventoryQuantity
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Create Product

```graphql
mutation createProduct($input: ProductInput!) {
  productCreate(input: $input) {
    product {
      id
      title
      handle
    }
    userErrors {
      field
      message
    }
  }
}
```

#### Update Product

```graphql
mutation updateProduct($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      title
    }
    userErrors {
      field
      message
    }
  }
}
```

#### Get Shop Info

```graphql
query getShop {
  shop {
    name
    email
    myshopifyDomain
    plan {
      displayName
    }
  }
}
```

---

## Project Structure

```
official-boiler/
├── app/
│   ├── (pages)/              # App pages (with layout)
│   │   └── plan/
│   │       └── page.tsx      # /plan route
│   │
│   ├── api/                  # API routes
│   │   ├── auth/
│   │   │   ├── route.ts      # OAuth initiation
│   │   │   └── callback/
│   │   │       └── route.ts  # OAuth callback
│   │   └── products/
│   │       └── create/
│   │           └── route.ts  # Product creation API
│   │
│   ├── layout.tsx            # Root layout (App Bridge setup)
│   ├── page.tsx              # Home page
│   ├── providers.tsx         # App Bridge provider + navigation
│   └── globals.css           # Global styles
│
├── lib/
│   ├── authenticate.ts       # Authentication helpers
│   ├── shopify.ts            # Shopify API config
│   └── db.ts                 # Prisma client
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── dev.db                # SQLite database (dev)
│   └── migrations/           # Database migrations
│
├── types/
│   ├── graphql.ts            # GraphQL types
│   └── shopify-components.d.ts # Web component types
│
├── .env.local                # Environment variables
├── next.config.ts            # Next.js config
├── tsconfig.json             # TypeScript config
├── package.json              # Dependencies
└── shopify.app.toml          # Shopify CLI config
```

### Key Files Explained

#### `lib/shopify.ts`

Configures the Shopify API client:

```typescript
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES?.split(","),
  hostName: process.env.SHOPIFY_APP_URL!,
  apiVersion: ApiVersion.October24,
  isEmbeddedApp: true,
  sessionStorage: new PrismaSessionStorage(prisma),
});
```

#### `lib/authenticate.ts`

Provides authentication functions:
- `authenticate()` - Main auth function (with token exchange)
- `authenticateAdmin()` - Auth via session cookies
- `getSessionFromToken()` - Get session from JWT

#### `app/layout.tsx`

Root layout that:
- Includes App Bridge and Polaris scripts
- Sets Shopify API key in meta tag
- Wraps app in ShopifyAppProvider

#### `app/providers.tsx`

Client component that:
- Provides navigation integration
- Renders `<s-app-nav>`
- Intercepts link clicks for client-side routing

#### `next.config.ts`

Sets Content Security Policy headers for embedding:

```typescript
headers: [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors https://*.myshopify.com https://admin.shopify.com;",
  },
],
```

---

## Common Patterns

### Pattern 1: Protected Page

```typescript
// app/(pages)/products/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function ProductsPage() {
  const shopify = useAppBridge();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    const token = await shopify.idToken();
    const response = await fetch("/api/products", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setProducts(data.products);
    setLoading(false);
  };
  
  if (loading) {
    return <s-spinner />;
  }
  
  return (
    <s-page heading="Products">
      <s-stack direction="block">
        {products.map((product) => (
          <s-box key={product.id}>
            <s-text>{product.title}</s-text>
          </s-box>
        ))}
      </s-stack>
    </s-page>
  );
}
```

### Pattern 2: Form with Validation

```typescript
"use client";
import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function ProductForm() {
  const shopify = useAppBridge();
  const [title, setTitle] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const validate = () => {
    const newErrors: string[] = [];
    if (!title.trim()) {
      newErrors.push("Title is required");
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      const token = await shopify.idToken();
      const response = await fetch("/api/products/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      
      if (response.ok) {
        shopify.toast.show("Product created!");
        setTitle("");
      } else {
        throw new Error("Failed to create product");
      }
    } catch (error) {
      shopify.toast.show("Error occurred", { isError: true });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <s-form onSubmit={handleSubmit}>
      <s-stack direction="block" gap="base">
        {errors.length > 0 && (
          <s-banner tone="critical" heading="Errors">
            {errors.map((error, i) => (
              <s-text key={i}>{error}</s-text>
            ))}
          </s-banner>
        )}
        
        <s-text-field
          label="Product Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.includes("Title is required")}
        />
        
        <s-button type="submit" loading={loading}>
          Create Product
        </s-button>
      </s-stack>
    </s-form>
  );
}
```

### Pattern 3: Data Table

```typescript
"use client";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function ProductTable() {
  const shopify = useAppBridge();
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    const token = await shopify.idToken();
    const response = await fetch("/api/products", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setProducts(data.products);
  };
  
  const deleteProduct = async (id: string) => {
    const token = await shopify.idToken();
    await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    shopify.toast.show("Product deleted");
    fetchProducts();
  };
  
  return (
    <s-data-table>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.title}</td>
              <td>{product.status}</td>
              <td>
                <s-button onClick={() => deleteProduct(product.id)}>
                  Delete
                </s-button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </s-data-table>
  );
}
```

### Pattern 4: Modal

```typescript
"use client";
import { useState } from "react";

export default function ProductActions() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <s-button onClick={() => setShowModal(true)}>
        Delete Product
      </s-button>
      
      {showModal && (
        <s-modal
          heading="Delete Product"
          onClose={() => setShowModal(false)}
        >
          <s-stack direction="block" gap="base">
            <s-text>Are you sure you want to delete this product?</s-text>
            
            <s-button-group>
              <s-button
                slot="primary-action"
                tone="critical"
                onClick={handleDelete}
              >
                Delete
              </s-button>
              <s-button
                slot="secondary-actions"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </s-button>
            </s-button-group>
          </s-stack>
        </s-modal>
      )}
    </>
  );
}
```

### Pattern 5: Loading States

```typescript
"use client";
import { useEffect, useState } from "react";

export default function ProductList() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  if (loading) {
    return (
      <s-stack align="center" justify="center" padding="large">
        <s-spinner size="large" />
      </s-stack>
    );
  }
  
  if (products.length === 0) {
    return (
      <s-empty-state
        heading="No products yet"
        action={{ content: "Create product", onAction: createProduct }}
      >
        <s-text>Get started by creating your first product.</s-text>
      </s-empty-state>
    );
  }
  
  return (
    <s-stack direction="block">
      {products.map((product) => (
        <s-box key={product.id}>
          <s-text>{product.title}</s-text>
        </s-box>
      ))}
    </s-stack>
  );
}
```

---

## Security Best Practices

### 1. Never Expose Secrets

```typescript
// ❌ WRONG - Never do this
const apiSecret = process.env.SHOPIFY_API_SECRET;
return NextResponse.json({ apiSecret }); // NEVER!

// ✅ CORRECT - Keep secrets server-side only
// Secrets should only be used in lib/shopify.ts
```

### 2. Validate All Inputs

```typescript
import shopify from "@/lib/shopify";

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get("shop");
  
  // ❌ WRONG
  // const sessionId = `offline_${shop}`;
  
  // ✅ CORRECT - Always sanitize
  const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
  if (!sanitizedShop) {
    return NextResponse.json({ error: "Invalid shop" }, { status: 400 });
  }
  const sessionId = shopify.session.getOfflineId(sanitizedShop);
}
```

### 3. Verify JWT Tokens

```typescript
// ❌ WRONG - Don't trust tokens blindly
const shop = JSON.parse(atob(token.split(".")[1])).dest;

// ✅ CORRECT - Always verify
const payload = await shopify.session.decodeSessionToken(token);
const shop = payload.dest.replace("https://", "");
```

### 4. Use HTTPS Only

```typescript
// next.config.ts
const nextConfig = {
  // Only allow embedding in Shopify admin
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors https://*.myshopify.com https://admin.shopify.com;",
          },
        ],
      },
    ];
  },
};
```

### 5. Rate Limiting

```typescript
// Implement rate limiting on API routes
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
  
  // Continue with request...
}
```

### 6. Validate Scopes

```typescript
export async function POST(request: NextRequest) {
  const { session } = await authenticate(request);
  
  // Check if session has required scope
  if (!session.scope?.includes("write_products")) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  
  // Continue...
}
```

### 7. Handle Errors Gracefully

```typescript
export async function POST(request: NextRequest) {
  try {
    const { session, admin } = await authenticate(request);
    // ... your code
  } catch (error) {
    console.error("API error:", error);
    
    // Don't expose internal errors
    return NextResponse.json(
      { error: "An error occurred" }, // Generic message
      { status: 500 }
    );
  }
}
```

### 8. Secure Session Storage

```typescript
// Use database (not in-memory or file storage in production)
sessionStorage: new PrismaSessionStorage(prisma)

// Not recommended for production:
// - MemorySessionStorage
// - FileSessionStorage
```

---

## Troubleshooting

### "No session found"

**Symptoms:**
- API routes return 401 Unauthorized
- Session is null when loading from database

**Solutions:**

1. **Check JWT token is being sent:**
   ```typescript
   // Frontend
   const token = await shopify.idToken();
   console.log("Token:", token); // Should be present
   
   // API Route
   const authHeader = request.headers.get("authorization");
   console.log("Auth header:", authHeader); // Should be "Bearer ..."
   ```

2. **Verify API key matches:**
   ```bash
   # .env.local
   SHOPIFY_API_KEY=your_key
   NEXT_PUBLIC_SHOPIFY_API_KEY=your_key # Must match!
   ```

3. **Check session exists in database:**
   ```bash
   npm run prisma:studio
   # Look in Session table for your shop
   ```

4. **Re-install app:**
   ```
   Uninstall app → Install again → New OAuth flow → Token saved
   ```

### "Invalid shop domain"

**Symptoms:**
- OAuth fails with "Invalid shop domain" error

**Solutions:**

1. **Check shop format:**
   ```
   ✅ CORRECT: store.myshopify.com
   ❌ WRONG: https://store.myshopify.com
   ❌ WRONG: store
   ```

2. **Use sanitizeShop:**
   ```typescript
   const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
   ```

### CORS Errors

**Symptoms:**
- Fetch requests fail with CORS error
- App doesn't load in Shopify admin

**Solutions:**

1. **Check CSP headers in `next.config.ts`:**
   ```typescript
   headers: [
     {
       key: 'Content-Security-Policy',
       value: "frame-ancestors https://*.myshopify.com https://admin.shopify.com;",
     },
   ],
   ```

2. **Verify app URL in Partner Dashboard:**
   ```
   App URL: https://your-app.com
   Redirect URLs: https://your-app.com/api/auth/callback
   ```

3. **Check embedded setting:**
   ```typescript
   // lib/shopify.ts
   isEmbeddedApp: true,
   ```

### Database Connection Errors

**Symptoms:**
- "Can't reach database server"
- "Connection timeout"

**Solutions:**

1. **Check DATABASE_URL:**
   ```bash
   # .env.local
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   ```

2. **Regenerate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

3. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

4. **For SQLite (dev only):**
   ```bash
   DATABASE_URL="file:./dev.db"
   ```

### Token Exchange Fails

**Symptoms:**
- "Token exchange failed" error
- App keeps redirecting to OAuth

**Solutions:**

1. **Install app first:**
   - Token exchange only works for installed apps
   - Complete OAuth flow at least once

2. **Check app approval:**
   - App must be approved/installed on the store
   - Development stores auto-approve

3. **Verify scopes:**
   - Scopes in code must match Partner Dashboard
   - If changed, re-install app

### App Bridge Not Working

**Symptoms:**
- `useAppBridge()` returns undefined
- Toast notifications don't show

**Solutions:**

1. **Check scripts are loaded:**
   ```tsx
   // app/layout.tsx
   <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
   ```

2. **Verify API key meta tag:**
   ```tsx
   <meta name="shopify-api-key" content={apiKey} />
   ```

3. **Use in client component:**
   ```tsx
   "use client"; // Required!
   import { useAppBridge } from "@shopify/app-bridge-react";
   ```

### GraphQL Errors

**Symptoms:**
- GraphQL queries return errors
- "Field doesn't exist" errors

**Solutions:**

1. **Check API version:**
   ```typescript
   // lib/shopify.ts
   apiVersion: ApiVersion.October24,
   ```

2. **Verify query syntax:**
   ```graphql
   # Use GraphiQL to test queries
   # https://shopify.dev/docs/api/admin-graphql
   ```

3. **Check scopes:**
   ```typescript
   // Need write_products scope for productCreate
   scopes: ["write_products", "read_orders"],
   ```

### Next.js Routing Issues

**Symptoms:**
- Navigation causes full page reload
- App Bridge context lost on navigation

**Solutions:**

1. **Use navigation provider:**
   ```tsx
   // Wrap app in ShopifyAppProvider
   <ShopifyAppProvider>{children}</ShopifyAppProvider>
   ```

2. **Use Next.js router:**
   ```tsx
   import { useRouter } from "next/navigation";
   const router = useRouter();
   router.push("/page");
   ```

3. **Don't use <a> tags:**
   ```tsx
   // ❌ WRONG
   <a href="/page">Link</a>
   
   // ✅ CORRECT
   <s-link href="/page">Link</s-link>
   ```

---

## Additional Resources

### Official Documentation

- [Shopify API Docs](https://shopify.dev/docs/api)
- [App Bridge React](https://shopify.dev/docs/api/app-bridge-library/react)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Polaris Components](https://polaris.shopify.com/components)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)

### Example Queries

#### Create Order

```graphql
mutation createOrder($order: OrderInput!) {
  orderCreate(order: $order) {
    order {
      id
      name
      totalPrice
    }
    userErrors {
      field
      message
    }
  }
}
```

#### Get Orders

```graphql
query getOrders($first: Int!) {
  orders(first: $first) {
    edges {
      node {
        id
        name
        email
        totalPrice
        lineItems(first: 10) {
          edges {
            node {
              title
              quantity
              price
            }
          }
        }
      }
    }
  }
}
```

#### Get Customers

```graphql
query getCustomers($first: Int!) {
  customers(first: $first) {
    edges {
      node {
        id
        email
        firstName
        lastName
        ordersCount
      }
    }
  }
}
```

---

## Quick Reference

### Environment Variables

```bash
SHOPIFY_API_KEY=              # From Partner Dashboard
SHOPIFY_API_SECRET=           # From Partner Dashboard
SHOPIFY_SCOPES=               # Comma-separated list
SHOPIFY_APP_URL=              # Your app URL
DATABASE_URL=                 # Database connection string
NEXT_PUBLIC_SHOPIFY_API_KEY=  # Same as SHOPIFY_API_KEY
```

### Common Commands

```bash
# Development
npm run dev                   # Start with Shopify CLI
npm run dev:next              # Start Next.js only

# Database
npm run prisma:generate       # Generate client
npm run prisma:migrate        # Run migrations
npm run prisma:studio         # Open GUI

# Build
npm run build                 # Build for production
npm start                     # Start production server
```

### Authentication Flow

```
1. OAuth: Get access token → Store in database
2. Embedded: JWT → Load session → Get access token
3. API Call: Access token → Shopify API → Response
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/shopify.ts` | Shopify API configuration |
| `lib/authenticate.ts` | Authentication helpers |
| `app/layout.tsx` | App Bridge setup |
| `app/providers.tsx` | Navigation integration |
| `prisma/schema.prisma` | Database schema |

---

## Summary

This boilerplate provides everything you need to build a Shopify app:

✅ **OAuth** - Secure token storage  
✅ **Authentication** - JWT + Access tokens  
✅ **GraphQL** - Type-safe API calls  
✅ **UI** - Polaris web components  
✅ **Navigation** - Client-side routing  
✅ **Database** - Prisma + SQLite/PostgreSQL  

**Next steps:**
1. Customize the UI for your use case
2. Add more API routes
3. Implement your business logic
4. Deploy to production

Happy building! 🚀

