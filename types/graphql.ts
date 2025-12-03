/**
 * GraphQL Types for Shopify Admin API
 * 
 * These are manually defined common types. For full type generation, you can:
 * 1. Use Shopify CLI: `shopify app generate schema`
 * 2. Or fetch from: https://shopify.dev/api/admin-graphql
 */

// ========== Common Shopify Types ==========

export type Maybe<T> = T | null;

export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: string;
  Decimal: string;
  HTML: string;
  JSON: string | Record<string, any>;
  Money: string;
  URL: string;
  UnsignedInt64: string;
};

// ========== Product Types ==========

export type ProductInput = {
  title?: string;
  descriptionHtml?: string;
  handle?: string;
  status?: ProductStatus;
  vendor?: string;
  productType?: string;
  tags?: string[];
};

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  DRAFT = "DRAFT",
}

// ========== Collection Types ==========

export type CollectionImageInput = {
  src?: string;
  attachment?: string;
  alt?: string;
};

export type CollectionSEOInput = {
  title?: string;
  description?: string;
};

export type CollectionRuleInput = {
  column: CollectionRuleColumn;
  relation: CollectionRuleRelation;
  condition: string;
  conditionObjectId?: string;
};

export type CollectionRuleSetInput = {
  appliedDisjunctively: boolean;
  rules: CollectionRuleInput[];
};

export type CollectionInput = {
  title: string;
  descriptionHtml?: string;
  handle?: string;
  image?: CollectionImageInput;
  seo?: CollectionSEOInput;
  templateSuffix?: string;
  sortOrder?: CollectionSortOrder;
  products?: string[];
  ruleSet?: CollectionRuleSetInput;
};

export enum CollectionRuleColumn {
  TITLE = "TITLE",
  TYPE = "TYPE",
  VENDOR = "VENDOR",
  TAG = "TAG",
  VARIANT_TITLE = "VARIANT_TITLE",
  VARIANT_PRICE = "VARIANT_PRICE",
  VARIANT_COMPARE_AT_PRICE = "VARIANT_COMPARE_AT_PRICE",
  VARIANT_WEIGHT = "VARIANT_WEIGHT",
  VARIANT_INVENTORY = "VARIANT_INVENTORY",
  IS_PRICE_REDUCED = "IS_PRICE_REDUCED",
  PRODUCT_CATEGORY_ID = "PRODUCT_CATEGORY_ID",
  PRODUCT_CATEGORY_ID_WITH_DESCENDANTS = "PRODUCT_CATEGORY_ID_WITH_DESCENDANTS",
  PRODUCT_TAXONOMY_NODE_ID = "PRODUCT_TAXONOMY_NODE_ID",
  PRODUCT_METAFIELD_DEFINITION = "PRODUCT_METAFIELD_DEFINITION",
  VARIANT_METAFIELD_DEFINITION = "VARIANT_METAFIELD_DEFINITION",
}

export enum CollectionRuleRelation {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  CONTAINS = "CONTAINS",
  NOT_CONTAINS = "NOT_CONTAINS",
  STARTS_WITH = "STARTS_WITH",
  ENDS_WITH = "ENDS_WITH",
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  IS_SET = "IS_SET",
  IS_NOT_SET = "IS_NOT_SET",
}

export enum CollectionSortOrder {
  MANUAL = "MANUAL",
  BEST_SELLING = "BEST_SELLING",
  ALPHA_ASC = "ALPHA_ASC",
  ALPHA_DESC = "ALPHA_DESC",
  PRICE_ASC = "PRICE_ASC",
  PRICE_DESC = "PRICE_DESC",
  CREATED = "CREATED",
  CREATED_DESC = "CREATED_DESC",
}

export type Collection = {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  image?: {
    url: string;
    altText?: string;
    width?: number;
    height?: number;
  };
  seo?: {
    title?: string;
    description?: string;
  };
  sortOrder: CollectionSortOrder;
  ruleSet?: {
    appliedDisjunctively: boolean;
    rules: {
      column: CollectionRuleColumn;
      relation: CollectionRuleRelation;
      condition: string;
      conditionObjectId?: string;
    }[];
  };
  productsCount?: { count: number };
  publishedOnCurrentPublication: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CollectionCreateMutation = {
  collectionCreate: {
    collection?: Collection;
    userErrors: {
      field: string[];
      message: string;
    }[];
  };
};

export type CollectionCreateMutationVariables = {
  input: CollectionInput;
};

export type Product = {
  id: string;
  title: string;
  handle: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;
  descriptionHtml?: string;
  totalInventory?: number;
  variants?: ProductVariantConnection;
  images?: ProductImageConnection;
};

export type ProductVariant = {
  id: string;
  title: string;
  price: string;
  inventoryQuantity?: number;
  sku?: string;
};

export type ProductVariantConnection = {
  edges: Array<{
    node: ProductVariant;
  }>;
};

export type ProductImage = {
  id: string;
  url: string;
  altText?: string;
  width?: number;
  height?: number;
};

export type ProductImageConnection = {
  edges: Array<{
    node: ProductImage;
  }>;
};

export type ProductConnection = {
  edges: Array<{
    node: Product;
  }>;
  pageInfo: PageInfo;
};

// ========== Mutation Response Types ==========

export type UserError = {
  field?: string[];
  message: string;
};

export type ProductCreatePayload = {
  product?: Product;
  userErrors: UserError[];
};

export type ProductUpdatePayload = {
  product?: Product;
  userErrors: UserError[];
};

// ========== Pagination ==========

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
};

// ========== Query/Mutation Variables ==========

export type CreateProductMutationVariables = {
  input: ProductInput;
};

export type CreateProductMutation = {
  productCreate: ProductCreatePayload;
};

export type GetProductsQueryVariables = {
  first?: number;
  after?: string;
  before?: string;
  query?: string;
};

export type GetProductsQuery = {
  products: ProductConnection;
};

// ========== Helper Types for API Responses ==========

export type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
  extensions?: Record<string, any>;
};

