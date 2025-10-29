"use client";

import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CollectionsPage() {
  const shopify = useAppBridge();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDownloadTemplate = async (type: "manual" | "smart") => {
    setLoading(true);
    try {
      const templateData =
        type === "manual"
          ? "Collection Title,Handle,Description,SEO Title,SEO Description,Published\nSummer Collection,summer-collection,Beautiful summer items,Summer Collection - Best Deals,Shop our amazing summer collection,true"
          : `Collection Title,Handle,Description,SEO Title,SEO Description,Published,Conditions,Product Title,Product Tag,Product Type,Price,Compare Price,Cost per Item,Stock Quantity,SKU,Barcode,Weight,Requires Shipping,Taxable,Image URL
Smart Collection,smart-collection,Products matching conditions,Smart Collection,Automated collection,true,"product_type equals T-Shirt, tag contains summer, price greater_than 20",,,,,,,,,,,,,
Example Collection,example-collection,Multiple conditions example,Example,Multiple conditions,true,"product_type equals Shoes, vendor equals Nike, inventory_quantity greater_than 0",,,,,,,,,,,,,`;

      const blob = new Blob([templateData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-collections-template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      shopify.toast.show(
        `${
          type === "manual" ? "Manual" : "Smart"
        } collection template downloaded!`
      );
    } catch (error) {
      shopify.toast.show("Error downloading template", { isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <s-page heading="Collections Management">
      <s-stack direction="block" gap="large" padding="large">
        {" "}
        <s-section>
          <s-stack gap="base">
            {/* Collection Actions */}
            <s-box
              padding="base"
              background="base"
              borderRadius="base"
              border="base"
            >
              <s-stack gap="base">
                <s-heading>Collection Actions</s-heading>
                <s-paragraph color="subdued">
                  Manage your product collections with upload, download, and
                  create features.
                </s-paragraph>

                <s-stack direction="inline" gap="small-200">
                  <s-button
                    variant="secondary"
                    onClick={() => router.push("/collections/upload")}
                  >
                    Upload Collections
                  </s-button>
                  <s-button
                    variant="secondary"
                    onClick={() => router.push("/collections/download")}
                  >
                    Download Collections
                  </s-button>
                  <s-button
                    variant="primary"
                    onClick={() => router.push("/collections/create")}
                  >
                    Create Collection
                  </s-button>
                </s-stack>
              </s-stack>
            </s-box>

            {/* Template Downloads */}
            <s-box
              padding="base"
              background="base"
              borderRadius="base"
              border="base"
            >
              <s-stack gap="base">
                <s-heading>Download Templates</s-heading>
                <s-paragraph color="subdued">
                  Get CSV templates to create collections manually or set up
                  smart collections with conditions.
                </s-paragraph>

                <s-grid
                  gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                  gap="base"
                >
                  <s-box
                    padding="base"
                    background="base"
                    borderRadius="base"
                    border="base"
                  >
                    <s-stack gap="base">
                      <s-heading>Manual Collection Template</s-heading>
                      <s-paragraph color="subdued">
                        Template for manually curated collections. Add products
                        by title, handle, or SKU.
                      </s-paragraph>
                      <s-button
                        variant="primary"
                        onClick={() => handleDownloadTemplate("manual")}
                        loading={loading}
                      >
                        Download Manual Template
                      </s-button>
                    </s-stack>
                  </s-box>

                  <s-box
                    padding="base"
                    background="base"
                    borderRadius="base"
                    border="base"
                  >
                    <s-stack gap="base">
                      <s-heading>Smart Collection Template</s-heading>
                      <s-paragraph color="subdued">
                        Template for automated collections based on product
                        conditions and rules.
                      </s-paragraph>
                      <s-button
                        variant="primary"
                        onClick={() => handleDownloadTemplate("smart")}
                        loading={loading}
                      >
                        Download Smart Template
                      </s-button>
                    </s-stack>
                  </s-box>
                </s-grid>
              </s-stack>
            </s-box>
          </s-stack>
        </s-section>{" "}
      </s-stack>
    </s-page>
  );
}
