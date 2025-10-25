"use client";

import { Card, Text, Button, Grid, BlockStack } from "@shopify/polaris";

interface TemplateSectionProps {
  loading: boolean;
  onDownloadTemplate: (type: "manual" | "smart") => void;
}

export default function TemplateSection({
  loading,
  onDownloadTemplate,
}: TemplateSectionProps) {
  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Download Templates
        </Text>
        <Text as="p" tone="subdued">
          Get CSV templates to create collections manually or set up smart collections with conditions.
        </Text>
        
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" fontWeight="bold">
                  Manual Collection Template
                </Text>
                <Text as="p" tone="subdued">
                  Template for manually curated collections. Add products by title, handle, or SKU.
                </Text>
                <Button
                  variant="primary"
                  onClick={() => onDownloadTemplate("manual")}
                  loading={loading}
                >
                  Download Manual Template
                </Button>
              </BlockStack>
            </Card>
          </Grid.Cell>
          
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" fontWeight="bold">
                  Smart Collection Template
                </Text>
                <Text as="p" tone="subdued">
                  Template for automated collections based on product conditions and rules.
                </Text>
                <Button
                  variant="primary"
                  onClick={() => onDownloadTemplate("smart")}
                  loading={loading}
                >
                  Download Smart Template
                </Button>
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>
      </BlockStack>
    </Card>
  );
}
