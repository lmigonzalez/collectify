// app/api/collections/import/route.ts
// Import collections from CSV format

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";
import type {
  CollectionInput,
  CollectionRuleColumn,
  CollectionRuleRelation,
  CollectionSortOrder,
  CollectionCreateMutation,
  CollectionCreateMutationVariables,
} from "@/types/graphql";

interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  errors: number;
  results: {
    row: number;
    title: string;
    status: "success" | "error";
    message: string;
    collectionId?: string;
  }[];
  error?: string;
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
          rules: rules.map(
            (rule: {
              column: string;
              relation: string;
              condition: string;
              conditionObjectId?: string;
            }) => ({
              column: rule.column as CollectionRuleColumn,
              relation: rule.relation as CollectionRuleRelation,
              condition: rule.condition,
              conditionObjectId: rule.conditionObjectId,
            })
          ),
        };
      }
    } catch (error) {
      console.warn("Failed to parse rules JSON:", error);
    }
  }

  return input;
}

/**
 * Validates CSV row
 */
function validateCSVRow(row: CollectionCSVRow, rowNumber: number): string[] {
  const errors: string[] = [];

  if (!row.title || row.title.trim().length === 0) {
    errors.push(`Row ${rowNumber}: Title is required`);
  }

  if (row.title && row.title.length > 255) {
    errors.push(`Row ${rowNumber}: Title must be 255 characters or less`);
  }

  if (
    row.type === "manual" &&
    (!row.products || row.products.trim().length === 0)
  ) {
    errors.push(`Row ${rowNumber}: Manual collections must have products`);
  }

  if (row.type === "smart" && (!row.rules || row.rules.trim().length === 0)) {
    errors.push(`Row ${rowNumber}: Smart collections must have rules`);
  }

  if (
    row.sortOrder &&
    !Object.values(CollectionSortOrder).includes(
      row.sortOrder as CollectionSortOrder
    )
  ) {
    errors.push(`Row ${rowNumber}: Invalid sort order`);
  }

  return errors;
}

/**
 * Creates a collection using the collection creation endpoint
 */
async function createCollection(
  admin: {
    graphql: <T = unknown>(
      query: string,
      options?: { variables?: Record<string, unknown> }
    ) => Promise<{ json: () => Promise<{ data: T }> }>;
  },
  input: CollectionInput
): Promise<{ success: boolean; collectionId?: string; error?: string }> {
  try {
    const response = await admin.graphql<CollectionCreateMutation>(
      `#graphql
        mutation createCollection($input: CollectionInput!) {
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
      `,
      {
        variables: {
          input,
        } as CollectionCreateMutationVariables,
      }
    );

    const data = await response.json();

    if (data.data?.collectionCreate?.userErrors?.length > 0) {
      return {
        success: false,
        error: data.data.collectionCreate.userErrors
          .map((e) => e.message)
          .join(", "),
      };
    }

    return {
      success: true,
      collectionId: data.data.collectionCreate.collection?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * POST endpoint to import collections from CSV
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ImportResult>> {
  try {
    // Step 1: Authenticate the request
    const { session, admin } = await authenticate(request);

    console.log("🔐 Authenticated for shop:", session.shop);
    console.log(
      "🔑 Using token:",
      session.accessToken?.substring(0, 20) + "..."
    );

    // Step 2: Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const dryRun = formData.get("dryRun") === "true";

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          created: 0,
          updated: 0,
          errors: 0,
          results: [],
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
          created: 0,
          updated: 0,
          errors: 0,
          results: [],
          error: "No valid rows found in CSV",
        },
        { status: 400 }
      );
    }

    // Step 4: Validate rows
    const validationErrors: string[] = [];
    rows.forEach((row, index) => {
      const errors = validateCSVRow(row, index + 2); // +2 because CSV has header and is 1-indexed
      validationErrors.push(...errors);
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          created: 0,
          updated: 0,
          errors: validationErrors.length,
          results: validationErrors.map((error) => ({
            row: 0,
            title: "",
            status: "error" as const,
            message: error,
          })),
          error: "Validation failed",
        },
        { status: 400 }
      );
    }

    // Step 5: Process rows
    const results: ImportResult["results"] = [];
    let created = 0;
    const updated = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because CSV has header and is 1-indexed

      try {
        if (dryRun) {
          // Dry run - just validate
          results.push({
            row: rowNumber,
            title: row.title,
            status: "success",
            message: "Valid - would be created",
          });
          created++;
        } else {
          // Actually create the collection
          const input = csvRowToCollectionInput(row);
          const result = await createCollection(admin, input);

          if (result.success) {
            results.push({
              row: rowNumber,
              title: row.title,
              status: "success",
              message: "Collection created successfully",
              collectionId: result.collectionId,
            });
            created++;
          } else {
            results.push({
              row: rowNumber,
              title: row.title,
              status: "error",
              message: result.error || "Failed to create collection",
            });
            errors++;
          }
        }
      } catch (error) {
        results.push({
          row: rowNumber,
          title: row.title,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        errors++;
      }
    }

    return NextResponse.json({
      success: errors === 0,
      created,
      updated,
      errors,
      results,
    });
  } catch (error) {
    console.error("❌ Collection import error:", error);

    if (error instanceof Error && error.message === "Authentication failed") {
      return NextResponse.json(
        {
          success: false,
          created: 0,
          updated: 0,
          errors: 0,
          results: [],
          error: "Unauthorized - please authenticate",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        created: 0,
        updated: 0,
        errors: 0,
        results: [],
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to get import status and examples
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { session, admin } = await authenticate(request);

    return NextResponse.json({
      success: true,
      data: {
        supportedFormats: ["CSV"],
        maxFileSize: "10MB",
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
    console.error("❌ Error fetching import info:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch import information" },
      { status: 500 }
    );
  }
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Import collections from CSV:
 * POST /api/collections/import
 * FormData with 'file' field containing CSV
 *
 * 2. Dry run (validate only):
 * POST /api/collections/import
 * FormData with 'file' field and 'dryRun=true'
 *
 * 3. Get import information:
 * GET /api/collections/import
 *
 * CSV Format:
 * id,title,handle,descriptionHtml,type,products,rules,appliedDisjunctively,sortOrder,imageUrl,imageAlt,seoTitle,seoDescription,templateSuffix,published,createdAt,updatedAt
 * gid://shopify/Collection/NEW_MANUAL,"Sample Manual Collection",sample-manual,"<p>Manual collection</p>",manual,"gid://shopify/Product/123,gid://shopify/Product/456",,false,MANUAL,https://example.com/image.jpg,Sample Image,Sample SEO Title,Sample description,,true,2024-01-01T00:00:00Z,2024-01-01T00:00:00Z
 * gid://shopify/Collection/NEW_SMART,"Sample Smart Collection",sample-smart,"<p>Smart collection</p>",smart,,"[{\"column\":\"TYPE\",\"relation\":\"EQUALS\",\"condition\":\"Electronics\"}]",false,PRICE_ASC,https://example.com/smart.jpg,Smart Image,Smart SEO Title,Smart description,,true,2024-01-01T00:00:00Z,2024-01-01T00:00:00Z
 */
