"use client";

import React, { useState, useEffect } from "react";
import {
  CollectionInput,
  CollectionRuleInput,
  CollectionRuleColumn,
  CollectionRuleRelation,
  CollectionSortOrder,
  Product,
} from "@/types/graphql";
import { useAppBridge } from "@shopify/app-bridge-react";

interface FormData {
  title: string;
  handle: string;
  descriptionHtml: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: CollectionSortOrder;
  collectionType: "manual" | "smart";
  products: string[];
  rules: CollectionRuleInput[];
  appliedDisjunctively: boolean;
  imageSrc: string;
  imageAlt: string;
  templateSuffix: string;
  published: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  title: "",
  handle: "",
  descriptionHtml: "",
  seoTitle: "",
  seoDescription: "",
  sortOrder: CollectionSortOrder.MANUAL,
  collectionType: "manual",
  products: [],
  rules: [],
  appliedDisjunctively: false,
  imageSrc: "",
  imageAlt: "",
  templateSuffix: "",
  published: true,
};

const RULE_COLUMNS: { value: CollectionRuleColumn; label: string }[] = [
  { value: CollectionRuleColumn.TITLE, label: "Title" },
  { value: CollectionRuleColumn.TYPE, label: "Type" },
  { value: CollectionRuleColumn.PRODUCT_CATEGORY_ID, label: "Category" },
  { value: CollectionRuleColumn.VENDOR, label: "Vendor" },
  { value: CollectionRuleColumn.TAG, label: "Tag" },
  { value: CollectionRuleColumn.VARIANT_PRICE, label: "Price" },
  {
    value: CollectionRuleColumn.VARIANT_COMPARE_AT_PRICE,
    label: "Compare-at price",
  },
  { value: CollectionRuleColumn.VARIANT_WEIGHT, label: "Weight" },
  {
    value: CollectionRuleColumn.VARIANT_INVENTORY,
    label: "Inventory stock",
  },
  { value: CollectionRuleColumn.VARIANT_TITLE, label: "Variant's title" },
];

const RULE_RELATIONS: { value: CollectionRuleRelation; label: string }[] = [
  { value: CollectionRuleRelation.EQUALS, label: "is equal to" },
  { value: CollectionRuleRelation.NOT_EQUALS, label: "is not equal to" },
  { value: CollectionRuleRelation.CONTAINS, label: "contains" },
  { value: CollectionRuleRelation.NOT_CONTAINS, label: "does not contain" },
  { value: CollectionRuleRelation.STARTS_WITH, label: "starts with" },
  { value: CollectionRuleRelation.ENDS_WITH, label: "ends with" },
  { value: CollectionRuleRelation.GREATER_THAN, label: "is greater than" },
  { value: CollectionRuleRelation.LESS_THAN, label: "is less than" },
  { value: CollectionRuleRelation.IS_SET, label: "is set" },
  { value: CollectionRuleRelation.IS_NOT_SET, label: "is not set" },
];

const SORT_ORDERS: { value: CollectionSortOrder; label: string }[] = [
  { value: CollectionSortOrder.MANUAL, label: "Manual" },
  { value: CollectionSortOrder.BEST_SELLING, label: "Best Selling" },
  { value: CollectionSortOrder.ALPHA_ASC, label: "A-Z" },
  { value: CollectionSortOrder.ALPHA_DESC, label: "Z-A" },
  { value: CollectionSortOrder.PRICE_ASC, label: "Price: Low to High" },
  { value: CollectionSortOrder.PRICE_DESC, label: "Price: High to Low" },
  { value: CollectionSortOrder.CREATED, label: "Date: Old to New" },
  { value: CollectionSortOrder.CREATED_DESC, label: "Date: New to Old" },
];

export default function CreateCollection() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null as string | null,
    endCursor: null as string | null,
    currentPage: 1,
    totalPages: 1,
  });
  const appBridge = useAppBridge();

  const fetchProducts = async (
    cursor?: string | null,
    direction: "next" | "previous" | "first" = "first"
  ) => {
    setLoadingProducts(true);
    try {
      console.log("🔄 Fetching products from /api/products", {
        cursor,
        direction,
      });

      let response;
      const queryParams = new URLSearchParams({
        first: "50",
        ...(cursor && direction === "next" && { after: cursor }),
        ...(cursor && direction === "previous" && { before: cursor }),
      });

      try {
        // Try with App Bridge authentication first
        const token = await appBridge.idToken();
        console.log("🔑 Using App Bridge token for authentication");

        response = await fetch(`/api/products?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (authError) {
        console.log(
          "⚠️ App Bridge auth failed, trying without token:",
          authError
        );

        // Fallback: try without authentication (for development)
        response = await fetch(`/api/products?${queryParams.toString()}`);
      }

      const data = await response.json();

      console.log("📦 Products API response:", data);

      if (data.success) {
        setProducts(data.products);

        // Update pagination state
        const pageInfo = data.pageInfo;
        setPagination((prev) => ({
          hasNextPage: pageInfo.hasNextPage,
          hasPreviousPage: pageInfo.hasPreviousPage,
          startCursor: pageInfo.startCursor,
          endCursor: pageInfo.endCursor,
          currentPage:
            direction === "next"
              ? prev.currentPage + 1
              : direction === "previous"
              ? prev.currentPage - 1
              : 1,
          totalPages: Math.ceil(data.totalCount / 50) || 1,
        }));

        console.log(
          `✅ Loaded ${data.products.length} products (Page ${
            direction === "next"
              ? pagination.currentPage + 1
              : direction === "previous"
              ? pagination.currentPage - 1
              : 1
          })`
        );
      } else {
        console.error("❌ Failed to fetch products:", data.error);
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Pagination navigation functions
  const handleNextPage = () => {
    if (pagination.hasNextPage && pagination.endCursor) {
      fetchProducts(pagination.endCursor, "next");
    }
  };

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage && pagination.startCursor) {
      fetchProducts(pagination.startCursor, "previous");
    }
  };

  const handleFirstPage = () => {
    fetchProducts(null, "first");
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (
    field: keyof FormData,
    value:
      | string
      | boolean
      | CollectionSortOrder
      | CollectionRuleInput[]
      | string[]
  ) => {
    console.log(`Updating ${field} to:`, value); // Debug log
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // If switching to smart collection and no rules exist, add a default rule
      if (
        field === "collectionType" &&
        value === "smart" &&
        prev.rules.length === 0
      ) {
        newData.rules = [
          {
            column: CollectionRuleColumn.TITLE,
            relation: CollectionRuleRelation.EQUALS,
            condition: "",
          },
        ];
      }

      // If switching to manual collection, clear rules
      if (field === "collectionType" && value === "manual") {
        newData.rules = [];
      }

      return newData;
    });

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSortOrderChange = (event: {
    currentTarget: { value: string };
  }) => {
    handleInputChange(
      "sortOrder",
      event.currentTarget.value as CollectionSortOrder
    );
  };

  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          column: CollectionRuleColumn.TITLE,
          relation: CollectionRuleRelation.EQUALS,
          condition: "",
        },
      ],
    }));
  };

  const updateRule = (
    index: number,
    field: keyof CollectionRuleInput,
    value: CollectionRuleColumn | CollectionRuleRelation | string
  ) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      ),
    }));
  };

  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSelection = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];

      // Update formData with selected products
      setFormData((prevForm) => ({
        ...prevForm,
        products: newSelection,
      }));

      return newSelection;
    });
  };

  const isProductSelected = (productId: string) => {
    return selectedProducts.includes(productId);
  };

  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, "") // Remove special characters except spaces
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) {
      newErrors.push("Collection title is required");
    }

    if (formData.title.length > 255) {
      newErrors.push("Collection title must be 255 characters or less");
    }

    if (formData.handle && formData.handle.length > 255) {
      newErrors.push("Handle must be 255 characters or less");
    }

    if (formData.handle && !/^[a-z0-9-]+$/.test(formData.handle)) {
      newErrors.push(
        "Handle can only contain lowercase letters, numbers, and hyphens"
      );
    }

    if (formData.collectionType === "smart" && formData.rules.length === 0) {
      newErrors.push("Smart collections must have at least one rule");
    }

    // Note: Manual collections will be created empty and products can be added later
    // Removed validation that required products at creation time

    // Validate smart collection rules
    if (formData.collectionType === "smart") {
      formData.rules.forEach((rule, index) => {
        if (!rule.column || !rule.relation) {
          newErrors.push(`Rule ${index + 1}: Column and relation are required`);
        }
        if (
          rule.relation !== CollectionRuleRelation.IS_SET &&
          rule.relation !== CollectionRuleRelation.IS_NOT_SET &&
          (!rule.condition || !rule.condition.trim())
        ) {
          newErrors.push(`Rule ${index + 1}: Condition value is required`);
        }

        // Additional validation for specific rule types
        if (
          rule.column === CollectionRuleColumn.VARIANT_PRICE ||
          rule.column === CollectionRuleColumn.VARIANT_COMPARE_AT_PRICE ||
          rule.column === CollectionRuleColumn.VARIANT_WEIGHT ||
          rule.column === CollectionRuleColumn.VARIANT_INVENTORY
        ) {
          const numValue = parseFloat(rule.condition || "0");
          if (
            rule.relation === CollectionRuleRelation.GREATER_THAN ||
            rule.relation === CollectionRuleRelation.LESS_THAN
          ) {
            if (isNaN(numValue)) {
              newErrors.push(
                `Rule ${index + 1}: Numeric value required for this condition`
              );
            }
          }
        }
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      const collectionInput: CollectionInput = {
        title: formData.title,
        handle: formData.handle || generateHandle(formData.title),
        descriptionHtml: formData.descriptionHtml,
        sortOrder: formData.sortOrder,
      };

      // Add template suffix if provided
      if (formData.templateSuffix) {
        collectionInput.templateSuffix = formData.templateSuffix;
      }

      // Add SEO data if provided
      if (formData.seoTitle || formData.seoDescription) {
        collectionInput.seo = {
          title: formData.seoTitle,
          description: formData.seoDescription,
        };
      }

      // Add image if provided
      if (formData.imageSrc) {
        collectionInput.image = {
          src: formData.imageSrc,
          alt: formData.imageAlt,
        };
      }

      // Add collection-specific data
      if (formData.collectionType === "manual") {
        collectionInput.products = formData.products;
      } else {
        collectionInput.ruleSet = {
          appliedDisjunctively: formData.appliedDisjunctively,
          rules: formData.rules,
        };
      }

      const response = await fetch("/api/collections/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(collectionInput),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle API errors
        const errorMessages = result.details
          ? Array.isArray(result.details)
            ? result.details
            : [result.error || "Failed to create collection"]
          : [result.error || "Failed to create collection"];
        setErrors(errorMessages);
        return;
      }

      // Success! Show success message and optionally redirect
      console.log("✅ Collection created successfully:", result.collection);
      
      // Reset form
      setFormData(INITIAL_FORM_DATA);
      setSelectedProducts([]);
      
      // Show success toast using App Bridge
      try {
        appBridge.toast.show(`Collection "${result.collection?.title}" created successfully!`);
      } catch {
        // Fallback if toast fails
        alert(`Collection "${result.collection?.title}" created successfully!`);
      }
    } catch (error) {
      console.error("❌ Error creating collection:", error);
      setErrors(["Network error. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <s-page heading="Create Collection">
      <s-stack direction="block" gap="large" padding="large">
        {/* Error Display */}
        {errors.length > 0 && (
          <s-banner tone="critical" heading="Please fix the following errors:">
            <s-unordered-list>
              {errors.map((error, index) => (
                <li key={index}>
                  <s-text>{typeof error === 'string' ? error : JSON.stringify(error)}</s-text>
                </li>
              ))}
            </s-unordered-list>
          </s-banner>
        )}

        {/* Basic Information */}
        <s-section padding="base">
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
              Collection Title <span style={{ color: "red" }}>*</span>
            </label>
          </div>
          <s-text-field
            label=""
            value={formData.title}
            placeholder="Enter collection title"
            onInput={(e) =>
              handleInputChange("title", (e.target as HTMLInputElement).value)
            }
          />

          <s-text-area
            label="Collection Description"
            value={formData.descriptionHtml}
            placeholder="Enter collection description"
            onInput={(e) =>
              handleInputChange(
                "descriptionHtml",
                (e.target as HTMLTextAreaElement).value
              )
            }
            rows={3}
          />
        </s-section>

        <s-section padding="base">
          <s-choice-list
            label="Published Status"
            name="Published Status"
            onChange={(event: { currentTarget: { values: string[] } }) => {
              const values = event.currentTarget.values;
              handleInputChange("published", values[0] === "published");
            }}
          >
            <s-choice value="published" selected={formData.published}>
              Published
            </s-choice>
            <s-choice value="unpublished" selected={!formData.published}>
              Unpublished
            </s-choice>
          </s-choice-list>
        </s-section>
        <s-section padding="base">
          <s-choice-list
            label="Collection Type"
            name="Collection Type"
            onChange={(event: { currentTarget: { values: string[] } }) => {
              const values = event.currentTarget.values;
              console.log("Collection Type onChange - values:", values);
              handleInputChange("collectionType", values[0]);
            }}
          >
            <s-choice
              value="manual"
              selected={formData.collectionType === "manual"}
            >
              Manual Collection
            </s-choice>
            <s-choice
              value="smart"
              selected={formData.collectionType === "smart"}
            >
              Smart Collection
            </s-choice>
          </s-choice-list>
        </s-section>

        <s-section padding="base">
          <s-select
            label="Sort Order"
            value={formData.sortOrder}
            onChange={handleSortOrderChange}
          >
            {SORT_ORDERS.map((order) => (
              <s-option key={order.value} value={order.value}>
                {order.label}
              </s-option>
            ))}
          </s-select>
        </s-section>
        {formData.collectionType === "smart" && (
          <s-section padding="base">
            {/* Smart Collection Rules */}
            <s-stack direction="block" gap="base">
              <s-text type="strong">
                Collection Rules <span style={{ color: "red" }}>*</span>
              </s-text>
              <s-text color="subdued">
                Define rules to automatically include products in this
                collection
              </s-text>

              <s-stack direction="block" gap="small">
                <s-checkbox
                  label="Products must match any rule (OR logic)"
                  checked={formData.appliedDisjunctively}
                  onChange={(event) =>
                    handleInputChange(
                      "appliedDisjunctively",
                      event.currentTarget.checked
                    )
                  }
                />
                <s-text color="subdued">
                  When unchecked, products must match all rules (AND logic)
                </s-text>
              </s-stack>

              {formData.rules.length === 0 ? (
                <s-banner tone="info">
                  <s-text>
                    No rules defined. Add at least one rule to create a smart
                    collection.
                  </s-text>
                </s-banner>
              ) : (
                formData.rules.map((rule, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="w-full grid grid-cols-3 gap-2 items-end">
                      <div>
                        <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                          Column <span style={{ color: "red" }}>*</span>
                        </label>
                        <s-select
                          value={rule.column}
                          onChange={(event) =>
                            updateRule(index, "column", event.currentTarget.value)
                          }
                        >
                          {RULE_COLUMNS.map((column) => (
                            <s-option key={column.value} value={column.value}>
                              {column.label}
                            </s-option>
                          ))}
                        </s-select>
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                          Relation <span style={{ color: "red" }}>*</span>
                        </label>
                        <s-select
                          value={rule.relation}
                          onChange={(event) =>
                            updateRule(
                              index,
                              "relation",
                              event.currentTarget.value
                            )
                          }
                        >
                          {RULE_RELATIONS.map((relation) => (
                            <s-option key={relation.value} value={relation.value}>
                              {relation.label}
                            </s-option>
                          ))}
                        </s-select>
                      </div>
                      {rule.relation !== CollectionRuleRelation.IS_SET &&
                        rule.relation !== CollectionRuleRelation.IS_NOT_SET && (
                          <div>
                            <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                              Condition <span style={{ color: "red" }}>*</span>
                            </label>
                            <s-text-field
                              placeholder="Enter condition value"
                              value={rule.condition}
                              onInput={(e) =>
                                updateRule(
                                  index,
                                  "condition",
                                  (e.target as HTMLInputElement).value
                                )
                              }
                            />
                          </div>
                        )}
                    </div>
                    {formData.rules.length > 1 && (
                      <s-button
                        icon="delete"
                        onClick={() => removeRule(index)}
                        // disabled={formData.rules.length === 1}
                        tone="critical"
                      />
                    )}
                  </div>
                ))
              )}

              <s-button icon="plus" onClick={addRule}>
                Add Rule
              </s-button>
            </s-stack>
          </s-section>
        )}
        <s-section padding="base">
          {" "}
          {/* SEO Settings */}
          <s-text-field
            label="SEO Title"
            value={formData.seoTitle}
            placeholder="Enter collection SEO title"
            onInput={(e) =>
              handleInputChange(
                "seoTitle",
                (e.target as HTMLInputElement).value
              )
            }
          />
          <s-text-area
            label="SEO Description"
            value={formData.seoDescription}
            placeholder="Enter collection SEO description"
            onInput={(e) =>
              handleInputChange(
                "seoDescription",
                (e.target as HTMLTextAreaElement).value
              )
            }
            rows={3}
          />
        </s-section>

        <s-section padding="base">
          {" "}
          <s-drop-zone
            label="Upload"
            accessibilityLabel="Upload image of type jpg, png, or gif"
            accept=".jpg,.png,.gif"
            multiple
            onInput={(e) =>
              console.log("onInput", e)
            }
            onChange={(e) =>
              console.log("onChange", e)
            }
            onDropRejected={(e) =>
              console.log("onDropRejected", e)
            }
          />
          <s-text-field
            label="Image Alt Text"
            value={formData.imageAlt}
            placeholder="Enter image alt text"
            onInput={(e) =>
              handleInputChange(
                "imageAlt",
                (e.target as HTMLInputElement).value
              )
            }
          />
        </s-section>
        <s-section padding="base">
          <s-text-field
            label="Handle"
            value={formData.handle}
            placeholder="Enter collection handle"
            onInput={(e) =>
              handleInputChange("handle", (e.target as HTMLInputElement).value)
            }
          />
        </s-section>

        <s-stack alignItems="end">
          <s-button 
            variant="primary" 
            icon="plus" 
            onClick={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? "Creating..." : "Create Collection"}
          </s-button>
        </s-stack>
      </s-stack>
    </s-page>
  );
}
