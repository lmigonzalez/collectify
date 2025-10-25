"use client";
import React, { useState } from "react";

interface Collection {
  id: string;
  title: string;
  handle: string;
  descriptionHtml?: string;
  updatedAt: string;
  sortOrder: string;
  templateSuffix?: string;
  image?: {
    url: string;
  };
  seo?: {
    title?: string;
    description?: string;
  };
  ruleSet?: {
    appliedDisjunctively: boolean;
    rules: Array<{
      column: string;
      relation: string;
      condition: string;
    }>;
  };
  productsCount?: {
    count: number;
  };
}

interface DownloadResult {
  success: boolean;
  collectionsCount: number;
  message: string;
  error?: string;
}

interface ColumnOption {
  key: string;
  label: string;
  description: string;
  defaultSelected: boolean;
}

export default function DownloadCSV() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(
    null
  );
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Define available columns with their properties
  const columnOptions: ColumnOption[] = [
    {
      key: "id",
      label: "ID",
      description: "Collection ID",
      defaultSelected: true,
    },
    {
      key: "title",
      label: "Title",
      description: "Collection name",
      defaultSelected: true,
    },
    {
      key: "handle",
      label: "Handle",
      description: "URL handle",
      defaultSelected: true,
    },
    {
      key: "descriptionHtml",
      label: "Description",
      description: "HTML description",
      defaultSelected: false,
    },
    {
      key: "type",
      label: "Type",
      description: "Smart or Manual",
      defaultSelected: true,
    },
    {
      key: "products",
      label: "Products",
      description: "Product IDs",
      defaultSelected: false,
    },
    {
      key: "rules",
      label: "Rules",
      description: "Smart collection rules",
      defaultSelected: false,
    },
    {
      key: "appliedDisjunctively",
      label: "Applied Disjunctively",
      description: "Rule application logic",
      defaultSelected: false,
    },
    {
      key: "sortOrder",
      label: "Sort Order",
      description: "Collection sort order",
      defaultSelected: true,
    },
    {
      key: "imageUrl",
      label: "Image URL",
      description: "Collection image",
      defaultSelected: false,
    },
    {
      key: "imageAlt",
      label: "Image Alt",
      description: "Image alt text",
      defaultSelected: false,
    },
    {
      key: "seoTitle",
      label: "SEO Title",
      description: "SEO meta title",
      defaultSelected: false,
    },
    {
      key: "seoDescription",
      label: "SEO Description",
      description: "SEO meta description",
      defaultSelected: false,
    },
    {
      key: "templateSuffix",
      label: "Template Suffix",
      description: "Custom template",
      defaultSelected: false,
    },
    {
      key: "productsCount",
      label: "Products Count",
      description: "Number of products",
      defaultSelected: true,
    },
    {
      key: "updatedAt",
      label: "Updated At",
      description: "Last update date",
      defaultSelected: true,
    },
  ];

  // Initialize selected columns with default selections
  React.useEffect(() => {
    if (selectedColumns.length === 0) {
      setSelectedColumns(
        columnOptions.filter((col) => col.defaultSelected).map((col) => col.key)
      );
    }
  }, []);
  const fetchCollections = async () => {
    setIsDownloading(true);
    setDownloadResult(null);

    try {
      const response = await fetch("/api/collections/export");
      const result = await response.json();

      if (result.success) {
        setCollections(result.collections || []);
        setDownloadResult({
          success: true,
          collectionsCount: result.collections?.length || 0,
          message: `Successfully fetched ${
            result.collections?.length || 0
          } collections`,
        });
      } else {
        setDownloadResult({
          success: false,
          collectionsCount: 0,
          message: "Failed to fetch collections",
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Download error:", error);
      setDownloadResult({
        success: false,
        collectionsCount: 0,
        message: "Network error occurred",
        error: "Failed to fetch collections",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadCSV = () => {
    if (collections.length === 0) {
      alert("No collections to download. Please fetch collections first.");
      return;
    }

    if (selectedColumns.length === 0) {
      alert("Please select at least one column to download.");
      return;
    }

    // Create CSV headers based on selected columns
    const headers = selectedColumns;

    // Convert collections to CSV rows
    const csvRows = collections.map((collection) => {
      // Determine collection type based on ruleSet presence
      const type = collection.ruleSet ? "smart" : "manual";

      // Extract rules for smart collections
      const rules = collection.ruleSet
        ? JSON.stringify(collection.ruleSet.rules)
        : "";

      // Extract product count (we'll use productsCount if available)
      const productsCount = collection.productsCount?.count || 0;

      // Extract image information
      const imageUrl = collection.image?.url || "";
      const imageAlt = ""; // Not available in GraphQL response

      // Extract SEO information
      const seoTitle = collection.seo?.title || "";
      const seoDescription = collection.seo?.description || "";

      // Create row data object
      const rowData: { [key: string]: string | number | boolean } = {
        id: collection.id,
        title: `"${collection.title.replace(/"/g, '""')}"`,
        handle: collection.handle,
        descriptionHtml: `"${(collection.descriptionHtml || "").replace(
          /"/g,
          '""'
        )}"`,
        type: type,
        products: "", // Products - would need separate query to get product IDs
        rules: `"${rules.replace(/"/g, '""')}"`,
        appliedDisjunctively: collection.ruleSet?.appliedDisjunctively || false,
        sortOrder: collection.sortOrder,
        imageUrl: imageUrl,
        imageAlt: `"${imageAlt.replace(/"/g, '""')}"`,
        seoTitle: `"${seoTitle.replace(/"/g, '""')}"`,
        seoDescription: `"${seoDescription.replace(/"/g, '""')}"`,
        templateSuffix: collection.templateSuffix || "",
        productsCount: productsCount,
        updatedAt: collection.updatedAt,
      };

      // Return only selected columns
      return selectedColumns.map((col) => rowData[col] || "").join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `collections_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((col) => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(columnOptions.map((col) => col.key));
  };

  const selectDefaultColumns = () => {
    setSelectedColumns(
      columnOptions.filter((col) => col.defaultSelected).map((col) => col.key)
    );
  };

  return (
    <s-page heading="Download Collections as CSV">
      <s-stack direction="block" gap="large" padding="large">
        <s-section>
          <s-stack direction="block" gap="small">
            <s-heading>Export Collections</s-heading>
            <s-paragraph>
              Download all collections from your store as a CSV file. This file
              can be used for backup, migration, or analysis purposes.
            </s-paragraph>

            {!isDownloading && collections.length === 0 && (
              <s-button variant="primary" onClick={fetchCollections}>
                Fetch Collections
              </s-button>
            )}

            {isDownloading && (
              <s-stack direction="inline" gap="small">
                <s-spinner accessibilityLabel="Loading" size="base" />
                <s-paragraph>
                  Fetching collections from your store...
                </s-paragraph>
              </s-stack>
            )}

            {downloadResult && (
              <s-banner tone={downloadResult.success ? "success" : "critical"}>
                <s-stack direction="block" gap="small">
                  <s-text type="strong">
                    {downloadResult.success ? "✅ Success" : "❌ Error"}
                  </s-text>
                  <s-paragraph>{downloadResult.message}</s-paragraph>
                  {downloadResult.error && (
                    <s-paragraph>{downloadResult.error}</s-paragraph>
                  )}
                </s-stack>
              </s-banner>
            )}
          </s-stack>
        </s-section>

        {collections.length > 0 && (
          <s-section>
            <s-stack direction="block" gap="large">
              <s-stack direction="block" gap="small">
                <s-heading>Column Selection</s-heading>
                <s-paragraph>
                  Choose which fields to include in your CSV export. You can
                  select individual columns or use the quick selection buttons.
                </s-paragraph>
              </s-stack>

              <s-button-group>
                <s-button
                  slot="primary-action"
                  variant="primary"
                  onClick={selectAllColumns}
                >
                  Select All
                </s-button>
                <s-button
                  slot="secondary-actions"
                  variant="primary"
                  onClick={selectDefaultColumns}
                >
                  Default Selection
                </s-button>
                <s-button
                  slot="secondary-actions"
                  variant="primary"
                  onClick={() => setSelectedColumns([])}
                >
                  Clear All
                </s-button>
              </s-button-group>

              <s-stack direction="block" gap="small">
                <s-text type="strong">Select columns to export:</s-text>
                <div className="grid md:grid-cols-3 gap-2">
                  {columnOptions.map((column) => (
                    <s-checkbox
                      key={column.key}
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => handleColumnToggle(column.key)}
                      label={column.label}
                      details={column.description}
                    />
                  ))}
                </div>
              </s-stack>

              <s-banner
                tone={selectedColumns.length === 0 ? "critical" : "success"}
              >
                <s-stack direction="inline" gap="small">
                  <s-text type="strong">
                    Selected: {selectedColumns.length} of {columnOptions.length}{" "}
                    columns
                  </s-text>
                  {selectedColumns.length === 0 && (
                    <s-text type="generic" tone="critical">
                      ⚠️ Please select at least one column
                    </s-text>
                  )}
                  {selectedColumns.length > 0 && (
                    <s-text type="generic" tone="success">
                      ✅ Ready to export
                    </s-text>
                  )}
                </s-stack>
              </s-banner>

              <s-button
                variant="primary"
                onClick={downloadCSV}
                disabled={selectedColumns.length === 0}
              >
                Download CSV File ({selectedColumns.length} columns)
              </s-button>
            </s-stack>
          </s-section>
        )}
      </s-stack>
    </s-page>
  );
}
