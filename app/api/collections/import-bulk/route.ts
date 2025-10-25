// app/api/collections/import-bulk/route.ts
// Bulk import collections using Shopify's bulk operations API

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";
import type {
  CollectionInput,
  CollectionRuleColumn,
  CollectionRuleRelation,
  CollectionSortOrder,
} from "@/types/graphql";

interface BulkImportResult {
  success: boolean;
  bulkOperationId?: string;
  message: string;
  error?: string;
}

interface StagedUploadTarget {
  url: string;
  resourceUrl: string;
  parameters: {
    name: string;
    value: string;
  }[];
}

interface BulkOperation {
  id: string;
  status: string;
  url: string;
}

interface CollectionRule {
  column: string;
  relation: string;
  condition: string;
  conditionObjectId?: string;
}

interface ShopifyAdmin {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<{ json: () => Promise<{ data: unknown }> }>;
}

interface CollectionCSVRow {
  id?: string;
  title: string;
  handle?: string;
  descriptionHtml?: string;
  type: "manual" | "smart";
  products?: string;
  rules?: string;
  appliedDisjunctively?: boolean;
  sortOrder?: string;
  imageUrl?: string;
  imageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  templateSuffix?: string;
  published?: boolean;
}

interface StagedUploadsCreateResponse {
  data?: {
    stagedUploadsCreate?: {
      userErrors: Array<{
        message: string;
      }>;
      stagedTargets: StagedUploadTarget[];
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

interface BulkOperationRunMutationResponse {
  data?: {
    bulkOperationRunMutation?: {
      userErrors: Array<{
        message: string;
      }>;
      bulkOperation: BulkOperation;
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * Parses CSV content into rows
 */
function parseCSV(csvContent: string): CollectionCSVRow[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const rows: CollectionCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const row: CollectionCSVRow = {
      title: "",
      type: "manual",
    };

    headers.forEach((header, index) => {
      const value = values[index]?.replace(/"/g, "") || "";

      switch (header) {
        case "id":
          row.id = value;
          break;
        case "title":
          row.title = value;
          break;
        case "handle":
          row.handle = value;
          break;
        case "descriptionHtml":
          row.descriptionHtml = value;
          break;
        case "type":
          row.type = (value as "manual" | "smart") || "manual";
          break;
        case "products":
          row.products = value;
          break;
        case "rules":
          row.rules = value;
          break;
        case "appliedDisjunctively":
          row.appliedDisjunctively = value.toLowerCase() === "true";
          break;
        case "sortOrder":
          row.sortOrder = value;
          break;
        case "imageUrl":
          row.imageUrl = value;
          break;
        case "imageAlt":
          row.imageAlt = value;
          break;
        case "seoTitle":
          row.seoTitle = value;
          break;
        case "seoDescription":
          row.seoDescription = value;
          break;
        case "templateSuffix":
          row.templateSuffix = value;
          break;
        case "published":
          row.published = value.toLowerCase() === "true";
          break;
      }
    });

    if (row.title) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parses a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current);
      current = "";
    } else {
      current += char;
    }
    i++;
  }

  // Add the last field
  result.push(current);
  return result;
}

/**
 * Converts CSV row to CollectionInput
 */
function csvRowToCollectionInput(row: CollectionCSVRow): CollectionInput {
  const input: CollectionInput = {
    title: row.title,
  };

  // Add optional fields
  if (row.handle) input.handle = row.handle;
  if (row.descriptionHtml) input.descriptionHtml = row.descriptionHtml;
  if (row.templateSuffix) input.templateSuffix = row.templateSuffix;
  if (row.sortOrder) input.sortOrder = row.sortOrder as CollectionSortOrder;

  // Add image
  if (row.imageUrl) {
    input.image = {
      src: row.imageUrl,
      alt: row.imageAlt || "",
    };
  }

  // Add SEO
  if (row.seoTitle || row.seoDescription) {
    input.seo = {
      title: row.seoTitle,
      description: row.seoDescription,
    };
  }

  // Add products for manual collections
  if (row.type === "manual" && row.products) {
    const productIds = row.products
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id && id.startsWith("gid://shopify/Product/"));

    if (productIds.length > 0) {
      input.products = productIds;
    }
  }

  // Add rules for smart collections
  if (row.type === "smart" && row.rules) {
    try {
      const rules = JSON.parse(row.rules);
      if (Array.isArray(rules) && rules.length > 0) {
        input.ruleSet = {
          appliedDisjunctively: row.appliedDisjunctively || false,
          rules: rules.map((rule: CollectionRule) => ({
            column: rule.column as CollectionRuleColumn,
            relation: rule.relation as CollectionRuleRelation,
            condition: rule.condition,
            conditionObjectId: rule.conditionObjectId,
          })),
        };
      }
    } catch (error) {
      console.warn("Failed to parse rules JSON:", error);
    }
  }

  return input;
}

/**
 * Converts collection inputs to JSONL format for bulk operations
 */
function createJSONLFromCollections(collections: CollectionInput[]): string {
  return collections
    .map((collection) => JSON.stringify({ input: collection }))
    .join("\n");
}

/**
 * Creates staged upload for bulk operation
 */
async function createStagedUpload(admin: ShopifyAdmin, filename: string): Promise<StagedUploadTarget> {
  const response = await admin.graphql(
    `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        userErrors {
          field
          message
        }
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
      }
    }
  `,
    {
      variables: {
        input: [
          {
            resource: "BULK_MUTATION_VARIABLES",
            filename: filename,
            mimeType: "text/jsonl",
            httpMethod: "POST",
          },
        ],
      },
    }
  );

  const data = await response.json() as StagedUploadsCreateResponse;

  if (data.data?.stagedUploadsCreate?.userErrors?.length && data.data.stagedUploadsCreate.userErrors.length > 0) {
    throw new Error(
      data.data.stagedUploadsCreate.userErrors.map((e: { message: string }) => e.message).join(", ")
    );
  }

  if (!data.data?.stagedUploadsCreate?.stagedTargets?.[0]) {
    throw new Error("No staged upload target returned");
  }

  return data.data.stagedUploadsCreate.stagedTargets[0];
}

/**
 * Uploads JSONL data to staged upload URL
 */
async function uploadJSONLToStagedUpload(stagedTarget: StagedUploadTarget, jsonlData: string): Promise<Response> {
  const formData = new FormData();

  // Add all parameters from staged upload
  stagedTarget.parameters.forEach((param: { name: string; value: string }) => {
    formData.append(param.name, param.value);
  });

  // Add the file as the last parameter
  formData.append("file", new Blob([jsonlData], { type: "text/jsonl" }));

  const uploadResponse = await fetch(stagedTarget.url, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`
    );
  }

  return uploadResponse;
}

/**
 * Creates bulk mutation operation
 */
async function createBulkOperation(admin: ShopifyAdmin, stagedUploadPath: string): Promise<BulkOperation> {
  const mutation = `
    mutation call($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(
    `
    mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!) {
      bulkOperationRunMutation(
        mutation: $mutation
        stagedUploadPath: $stagedUploadPath
      ) {
        bulkOperation {
          id
          status
          url
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
        mutation: mutation,
        stagedUploadPath: stagedUploadPath,
      },
    }
  );

  const data = await response.json() as BulkOperationRunMutationResponse;

  if (data.data?.bulkOperationRunMutation?.userErrors?.length && data.data.bulkOperationRunMutation.userErrors.length > 0) {
    throw new Error(
      data.data.bulkOperationRunMutation.userErrors
        .map((e: { message: string }) => e.message)
        .join(", ")
    );
  }

  if (!data.data?.bulkOperationRunMutation?.bulkOperation) {
    throw new Error("No bulk operation returned");
  }

  return data.data.bulkOperationRunMutation.bulkOperation;
}

/**
 * POST endpoint to bulk import collections from CSV using Shopify's bulk operations
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<BulkImportResult>> {
  try {
    // Step 1: Authenticate the request
    const { session, admin } = await authenticate(request);

    console.log("🔐 Authenticated for shop:", session.shop);

    // Step 2: Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
          error: "No file provided",
        },
        { status: 400 }
      );
    }

    // Step 3: Parse CSV content
    const csvContent = await file.text();
    const rows = parseCSV(csvContent);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid rows found in CSV",
          error: "No valid rows found in CSV",
        },
        { status: 400 }
      );
    }

    if (rows.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many collections. Maximum 1000 collections per bulk operation.",
          error: "Too many collections",
        },
        { status: 400 }
      );
    }

    console.log(`📊 Processing ${rows.length} collections for bulk import`);

    // Step 4: Convert CSV rows to collection inputs
    const collectionInputs = rows.map((row) => csvRowToCollectionInput(row));

    // Step 5: Create JSONL data
    const jsonlData = createJSONLFromCollections(collectionInputs);
    console.log(
      `📝 Created JSONL data with ${collectionInputs.length} collections`
    );

    // Step 6: Create staged upload
    const stagedTarget = await createStagedUpload(
      admin,
      `collections_bulk_${Date.now()}.jsonl`
    );
    console.log("📤 Created staged upload target");

    // Step 7: Upload JSONL to staged upload
    await uploadJSONLToStagedUpload(stagedTarget, jsonlData);
    console.log("⬆️ Uploaded JSONL data to staged upload");

    // Step 8: Create bulk operation
    const keyParam = stagedTarget.parameters.find((p: { name: string; value: string }) => p.name === "key");
    if (!keyParam?.value) {
      throw new Error("Failed to find key parameter in staged upload response");
    }
    
    const bulkOperation = await createBulkOperation(admin, keyParam.value);
    console.log("🚀 Created bulk operation:", bulkOperation.id);

    return NextResponse.json({
      success: true,
      bulkOperationId: bulkOperation.id,
      message: `Bulk import operation created successfully. Processing ${rows.length} collections.`,
    });
  } catch (error) {
    console.error("❌ Bulk import error:", error);

    if (error instanceof Error && error.message === "Authentication failed") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - please authenticate",
          error: "Unauthorized - please authenticate",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to get bulk import information
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    return NextResponse.json({
      success: true,
      data: {
        method: "bulk_operations",
        description:
          "Bulk import collections using Shopify's bulk operations API for better performance",
        supportedFormats: ["CSV"],
        maxFileSize: "20MB",
        maxRows: 1000,
        requiredFields: ["title", "type"],
        optionalFields: [
          "handle",
          "descriptionHtml",
          "products",
          "rules",
          "appliedDisjunctively",
          "sortOrder",
          "imageUrl",
          "imageAlt",
          "seoTitle",
          "seoDescription",
          "templateSuffix",
          "published",
        ],
        advantages: [
          "Faster processing for large datasets",
          "No rate limiting issues",
          "Asynchronous processing",
          "Better error handling",
          "Progress tracking via bulk operation status",
        ],
        examples: {
          manualCollection: {
            title: "Sample Manual Collection",
            handle: "sample-manual-collection",
            descriptionHtml: "<p>This is a manual collection</p>",
            type: "manual",
            products: "gid://shopify/Product/123,gid://shopify/Product/456",
            sortOrder: "MANUAL",
            imageUrl: "https://example.com/image.jpg",
            imageAlt: "Sample Image",
            seoTitle: "Sample Collection - SEO Title",
            seoDescription: "Sample collection description",
            published: "true",
          },
          smartCollection: {
            title: "Sample Smart Collection",
            handle: "sample-smart-collection",
            descriptionHtml: "<p>This is a smart collection</p>",
            type: "smart",
            rules:
              '[{"column":"TYPE","relation":"EQUALS","condition":"Electronics"}]',
            appliedDisjunctively: "false",
            sortOrder: "PRICE_ASC",
            imageUrl: "https://example.com/smart-image.jpg",
            imageAlt: "Smart Collection Image",
            seoTitle: "Smart Collection - SEO Title",
            seoDescription: "Smart collection description",
            published: "true",
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching bulk import info:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bulk import information" },
      { status: 500 }
    );
  }
}
