// app/api/collections/create/route.ts
// Advanced collection creation endpoint supporting both manual and smart collections

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";
import type {
  CollectionInput,
  CollectionCreateMutation,
  CollectionCreateMutationVariables,
  CollectionImageInput,
  CollectionSEOInput,
} from "@/types/graphql";
import {
  CollectionRuleColumn,
  CollectionRuleRelation,
  CollectionSortOrder,
} from "@/types/graphql";

interface CreateCollectionResponse {
  success: boolean;
  collection?: {
    id: string;
    title: string;
    handle: string;
    descriptionHtml: string;
    image?: CollectionImageInput;
    seo?: CollectionSEOInput;
    sortOrder: string;
    ruleSet?: {
      appliedDisjunctively: boolean;
      rules: {
        column: CollectionRuleColumn;
        relation: CollectionRuleRelation;
        condition: string;
        conditionObjectId?: string;
      }[];
    };
    productsCount?: number;
    publishedOnCurrentPublication: boolean;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
  details?: unknown;
}

// Valid collection rule columns
const VALID_RULE_COLUMNS = Object.values(CollectionRuleColumn);

// Valid collection rule relations
const VALID_RULE_RELATIONS = Object.values(CollectionRuleRelation);

// Valid sort orders
const VALID_SORT_ORDERS = Object.values(CollectionSortOrder);

/**
 * Validates collection input
 */
function validateCollectionInput(input: CollectionInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!input.title || input.title.trim().length === 0) {
    errors.push("Title is required");
  }

  if (input.title && input.title.length > 255) {
    errors.push("Title must be 255 characters or less");
  }

  // Validate handle if provided
  if (input.handle && input.handle.length > 255) {
    errors.push("Handle must be 255 characters or less");
  }

  // Validate sort order
  if (input.sortOrder && !VALID_SORT_ORDERS.includes(input.sortOrder)) {
    errors.push(
      `Invalid sort order. Must be one of: ${VALID_SORT_ORDERS.join(", ")}`
    );
  }

  // Validate rule set for smart collections
  if (input.ruleSet) {
    if (!input.ruleSet.rules || input.ruleSet.rules.length === 0) {
      errors.push("Smart collections must have at least one rule");
    }

    input.ruleSet.rules.forEach((rule, index) => {
      if (!rule.column || !VALID_RULE_COLUMNS.includes(rule.column)) {
        errors.push(
          `Rule ${
            index + 1
          }: Invalid column. Must be one of: ${VALID_RULE_COLUMNS.join(", ")}`
        );
      }

      if (!rule.relation || !VALID_RULE_RELATIONS.includes(rule.relation)) {
        errors.push(
          `Rule ${
            index + 1
          }: Invalid relation. Must be one of: ${VALID_RULE_RELATIONS.join(
            ", "
          )}`
        );
      }

      if (
        !rule.condition &&
        rule.relation !== "IS_SET" &&
        rule.relation !== "IS_NOT_SET"
      ) {
        errors.push(
          `Rule ${index + 1}: Condition is required for this relation type`
        );
      }
    });
  }

  // Validate that we have either products (manual) or rules (smart), not both
  if (input.products && input.products.length > 0 && input.ruleSet) {
    errors.push(
      "Cannot specify both products and rules. Choose either manual collection (products) or smart collection (rules)"
    );
  }

  // Validate that we have either products or rules
  if (!input.products && !input.ruleSet) {
    errors.push(
      "Must specify either products for manual collection or rules for smart collection"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a collection using Shopify GraphQL API
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateCollectionResponse>> {
  try {
    // Step 1: Authenticate the request
    const { session, admin } = await authenticate(request);

    console.log("🔐 Authenticated for shop:", session.shop);
    console.log(
      "🔑 Using token:",
      session.accessToken?.substring(0, 20) + "..."
    );

    // Step 2: Parse and validate request body
    const body: CollectionInput = await request.json();

    const validation = validateCollectionInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Step 3: Build GraphQL mutation input
    const collectionInput: CollectionInput = {
      title: body.title,
    };

    // Add optional fields
    if (body.descriptionHtml) {
      collectionInput.descriptionHtml = body.descriptionHtml;
    }

    if (body.handle) {
      collectionInput.handle = body.handle;
    }

    if (body.image) {
      collectionInput.image = body.image;
    }

    if (body.seo) {
      collectionInput.seo = body.seo;
    }

    if (body.templateSuffix) {
      collectionInput.templateSuffix = body.templateSuffix;
    }

    if (body.sortOrder) {
      collectionInput.sortOrder = body.sortOrder;
    }

    // Add products for manual collections
    if (body.products && body.products.length > 0) {
      collectionInput.products = body.products;
    }

    // Add rules for smart collections
    if (body.ruleSet) {
      collectionInput.ruleSet = {
        appliedDisjunctively: body.ruleSet.appliedDisjunctively,
        rules: body.ruleSet.rules.map((rule) => ({
          column: rule.column,
          relation: rule.relation,
          condition: rule.condition,
          ...(rule.conditionObjectId && {
            conditionObjectId: rule.conditionObjectId,
          }),
        })),
      };
    }

    // Step 4: Execute GraphQL mutation
    const response = await admin.graphql<CollectionCreateMutation>(
      `#graphql
        mutation createCollection($input: CollectionInput!) {
          collectionCreate(input: $input) {
            collection {
              id
              title
              handle
              descriptionHtml
              image {
                url
                altText
                width
                height
              }
              seo {
                title
                description
              }
              sortOrder
              ruleSet {
                appliedDisjunctively
                rules {
                  column
                  relation
                  condition
                  conditionObjectId
                }
              }
              productsCount
              publishedOnCurrentPublication
              createdAt
              updatedAt
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
          input: collectionInput,
        } as CollectionCreateMutationVariables,
      }
    );

    const data = await response.json();

    // Step 5: Handle GraphQL errors
    if (data.data?.collectionCreate?.userErrors?.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "GraphQL errors",
          details: data.data.collectionCreate.userErrors,
        },
        { status: 400 }
      );
    }

    // Step 6: Return success response
    const collection = data.data.collectionCreate.collection;

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          error: "Collection creation failed",
          details: "No collection returned from GraphQL mutation",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        descriptionHtml: collection.descriptionHtml,
        image: collection.image
          ? {
              src: collection.image.url,
              alt: collection.image.altText,
            }
          : undefined,
        seo: collection.seo,
        sortOrder: collection.sortOrder,
        ruleSet: collection.ruleSet,
        productsCount: collection.productsCount,
        publishedOnCurrentPublication: collection.publishedOnCurrentPublication,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Collection creation error:", error);

    if (error instanceof Error && error.message === "Authentication failed") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - please authenticate" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch available rule columns and relations
 * Useful for building collection creation forms
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { session, admin } = await authenticate(request);

    return NextResponse.json({
      success: true,
      data: {
        ruleColumns: VALID_RULE_COLUMNS,
        ruleRelations: VALID_RULE_RELATIONS,
        sortOrders: VALID_SORT_ORDERS,
        examples: {
          manualCollection: {
            title: "Summer Collection",
            descriptionHtml: "<p>Our best summer products</p>",
            products: [
              "gid://shopify/Product/123",
              "gid://shopify/Product/456",
            ],
            sortOrder: "MANUAL",
            image: {
              src: "https://example.com/summer-collection.jpg",
              alt: "Summer Collection",
            },
          },
          smartCollection: {
            title: "Electronics Under $100",
            descriptionHtml: "<p>Affordable electronics for everyone</p>",
            ruleSet: {
              appliedDisjunctively: false,
              rules: [
                {
                  column: "TYPE",
                  relation: "EQUALS",
                  condition: "Electronics",
                },
                {
                  column: "VARIANT_PRICE",
                  relation: "LESS_THAN",
                  condition: "100",
                },
              ],
            },
            sortOrder: "PRICE_ASC",
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching collection metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collection metadata" },
      { status: 500 }
    );
  }
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Manual Collection:
 * POST /api/collections/create
 * {
 *   "title": "Featured Products",
 *   "descriptionHtml": "<p>Our most popular items</p>",
 *   "products": ["gid://shopify/Product/123", "gid://shopify/Product/456"],
 *   "sortOrder": "MANUAL",
 *   "image": {
 *     "src": "https://example.com/featured.jpg",
 *     "alt": "Featured Products"
 *   }
 * }
 *
 * 2. Smart Collection:
 * POST /api/collections/create
 * {
 *   "title": "Electronics Under $100",
 *   "descriptionHtml": "<p>Affordable electronics</p>",
 *   "ruleSet": {
 *     "appliedDisjunctively": false,
 *     "rules": [
 *       {
 *         "column": "TYPE",
 *         "relation": "EQUALS",
 *         "condition": "Electronics"
 *       },
 *       {
 *         "column": "VARIANT_PRICE",
 *         "relation": "LESS_THAN",
 *         "condition": "100"
 *       }
 *     ]
 *   },
 *   "sortOrder": "PRICE_ASC"
 * }
 *
 * 3. Complex Smart Collection:
 * POST /api/collections/create
 * {
 *   "title": "Premium Accessories",
 *   "descriptionHtml": "<p>High-quality accessories from top brands</p>",
 *   "ruleSet": {
 *     "appliedDisjunctively": true,
 *     "rules": [
 *       {
 *         "column": "TAG",
 *         "relation": "EQUALS",
 *         "condition": "premium"
 *       },
 *       {
 *         "column": "VENDOR",
 *         "relation": "CONTAINS",
 *         "condition": "Apple"
 *       }
 *     ]
 *   },
 *   "sortOrder": "BEST_SELLING",
 *   "seo": {
 *     "title": "Premium Accessories - Best Quality",
 *     "description": "Shop our collection of premium accessories"
 *   }
 * }
 */
