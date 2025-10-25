"use client";

import { useAppBridge } from "@shopify/app-bridge-react";

export default function GuidePage() {
  const shopify = useAppBridge();

  return (
    <s-page heading="Collectify Guide">
      <s-stack direction="block" gap="large" padding="large">
        {/* Introduction */}
        <s-box
          padding="large"
          background="base"
          border="base"
          borderRadius="large"
        >
          <s-stack direction="block" gap="base">
            <s-heading>Complete Guide to Collection Management</s-heading>
            <s-paragraph color="subdued">
              Learn how to effectively manage your product collections using Collectify's powerful CSV-based tools. 
              This comprehensive guide covers everything from basic setup to advanced automation strategies.
            </s-paragraph>
          </s-stack>
        </s-box>

        {/* Collection Types */}
        <s-box
          padding="large"
          background="base"
          border="base"
          borderRadius="large"
        >
          <s-stack direction="block" gap="base">
            <s-heading>Collection Types</s-heading>
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="base">
              <s-box
                padding="base"
                background="subdued"
                border="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="small">
                  <s-text type="strong">Manual Collections</s-text>
                  <s-paragraph color="subdued">
                    Manually curated collections where you select specific products. 
                    Perfect for seasonal collections, featured products, or custom groupings.
                  </s-paragraph>
                  <s-unordered-list>
                    <li>Add products by title, handle, or SKU</li>
                    <li>Full control over product selection</li>
                    <li>Ideal for marketing campaigns</li>
                  </s-unordered-list>
                </s-stack>
              </s-box>

              <s-box
                padding="base"
                background="subdued"
                border="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="small">
                  <s-text type="strong">Smart Collections</s-text>
                  <s-paragraph color="subdued">
                    Automated collections based on conditions and rules. Products are automatically 
                    added or removed based on your criteria.
                  </s-paragraph>
                  <s-unordered-list>
                    <li>Set conditions for automatic inclusion</li>
                    <li>Updates automatically as products change</li>
                    <li>Perfect for inventory management</li>
                  </s-unordered-list>
                </s-stack>
              </s-box>
            </s-grid>
          </s-stack>
        </s-box>

        {/* CSV Format Guide */}
        <s-box
          padding="large"
          background="base"
          border="base"
          borderRadius="large"
        >
          <s-stack direction="block" gap="base">
            <s-heading>CSV Format Specifications</s-heading>
            
            <s-stack direction="block" gap="base">
              <s-text type="strong">Manual Collection Fields</s-text>
              <s-table variant="auto">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Collection Title</td>
                    <td>Yes</td>
                    <td>Name of your collection</td>
                  </tr>
                  <tr>
                    <td>Handle</td>
                    <td>Yes</td>
                    <td>URL-friendly version of the title</td>
                  </tr>
                  <tr>
                    <td>Description</td>
                    <td>No</td>
                    <td>Collection description for SEO</td>
                  </tr>
                  <tr>
                    <td>SEO Title</td>
                    <td>No</td>
                    <td>Custom title for search engines</td>
                  </tr>
                  <tr>
                    <td>SEO Description</td>
                    <td>No</td>
                    <td>Meta description for search engines</td>
                  </tr>
                  <tr>
                    <td>Published</td>
                    <td>No</td>
                    <td>true/false - whether collection is live</td>
                  </tr>
                </tbody>
              </s-table>
            </s-stack>

            <s-stack direction="block" gap="base">
              <s-text type="strong">Smart Collection Conditions</s-text>
              <s-paragraph color="subdued">
                Use the Conditions field to define rules for automatic product inclusion. 
                Separate multiple conditions with commas.
              </s-paragraph>
              
              <s-box
                padding="base"
                background="subdued"
                border="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="small">
                  <s-text type="strong">Available Condition Types:</s-text>
                  <s-unordered-list>
                    <li><s-text type="strong">product_type equals [type]:</s-text> Match specific product types</li>
                    <li><s-text type="strong">tag contains [tag]:</s-text> Include products with specific tags</li>
                    <li><s-text type="strong">vendor equals [vendor]:</s-text> Filter by product vendor</li>
                    <li><s-text type="strong">price greater_than [amount]:</s-text> Minimum price filter</li>
                    <li><s-text type="strong">price less_than [amount]:</s-text> Maximum price filter</li>
                    <li><s-text type="strong">inventory_quantity greater_than [number]:</s-text> Stock level filter</li>
                  </s-unordered-list>
                </s-stack>
              </s-box>
            </s-stack>
          </s-stack>
        </s-box>

        {/* Best Practices */}
        <s-box
          padding="large"
          background="subdued"
          border="base"
          borderRadius="large"
        >
          <s-stack direction="block" gap="base">
            <s-heading>Best Practices</s-heading>
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="base">
              <s-stack direction="block" gap="small">
                <s-text type="strong">Data Preparation</s-text>
                <s-unordered-list>
                  <li>Use consistent naming conventions</li>
                  <li>Validate product handles exist in your store</li>
                  <li>Test with small collections first</li>
                  <li>Keep backup copies of your CSV files</li>
                </s-unordered-list>
              </s-stack>
              
              <s-stack direction="block" gap="small">
                <s-text type="strong">Smart Collections</s-text>
                <s-unordered-list>
                  <li>Use specific, clear condition criteria</li>
                  <li>Test conditions with existing products</li>
                  <li>Monitor collection sizes regularly</li>
                  <li>Combine multiple conditions for precision</li>
                </s-unordered-list>
              </s-stack>
              
              <s-stack direction="block" gap="small">
                <s-text type="strong">Performance</s-text>
                <s-unordered-list>
                  <li>Avoid overly complex condition chains</li>
                  <li>Limit collection sizes for better performance</li>
                  <li>Use tags consistently across products</li>
                  <li>Regularly review and update collections</li>
                </s-unordered-list>
              </s-stack>
            </s-grid>
          </s-stack>
        </s-box>

        {/* Troubleshooting */}
        <s-box
          padding="large"
          background="base"
          border="base"
          borderRadius="large"
        >
          <s-stack direction="block" gap="base">
            <s-heading>Troubleshooting</s-heading>
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="base">
              <s-stack direction="block" gap="small">
                <s-text type="strong">Common Issues</s-text>
                <s-unordered-list>
                  <li><s-text type="strong">Products not appearing:</s-text> Check if product handles exist and are published</li>
                  <li><s-text type="strong">Smart collection empty:</s-text> Verify condition syntax and product attributes</li>
                  <li><s-text type="strong">Upload errors:</s-text> Check CSV format and required fields</li>
                  <li><s-text type="strong">Performance issues:</s-text> Reduce collection size or simplify conditions</li>
                </s-unordered-list>
              </s-stack>
              
              <s-stack direction="block" gap="small">
                <s-text type="strong">Getting Help</s-text>
                <s-paragraph color="subdued">
                  If you encounter issues not covered in this guide:
                </s-paragraph>
                <s-unordered-list>
                  <li>Check the Collections page for validation errors</li>
                  <li>Review your CSV file format against our templates</li>
                  <li>Test with a small sample of products first</li>
                  <li>Contact support with specific error messages</li>
                </s-unordered-list>
              </s-stack>
            </s-grid>
          </s-stack>
        </s-box>
      </s-stack>
    </s-page>
  );
}
