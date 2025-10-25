"use client";

import { Card, Text, Grid, BlockStack, List } from "@shopify/polaris";

export default function HelpSection() {
  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Need Help?
        </Text>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" fontWeight="bold">
                Manual Collections
              </Text>
              <Text as="p" tone="subdued">
                Manually select products for your collection. Perfect for curated collections.
              </Text>
            </BlockStack>
          </Grid.Cell>
          
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" fontWeight="bold">
                Smart Collections
              </Text>
              <Text as="p" tone="subdued">
                Automatically include products based on conditions like price, tags, or product type. Use commas to separate multiple conditions.
              </Text>
            </BlockStack>
          </Grid.Cell>
          
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" fontWeight="bold">
                CSV Format
              </Text>
              <Text as="p" tone="subdued">
                All templates use CSV format for easy editing in Excel, Google Sheets, or any text editor.
              </Text>
            </BlockStack>
          </Grid.Cell>
        </Grid>
        
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm" fontWeight="bold">
              Condition Syntax Examples:
            </Text>
            <List>
              <List.Item>
                <Text as="span">
                  <Text as="span" fontWeight="bold">Single condition:</Text> &quot;product_type equals T-Shirt&quot;
                </Text>
              </List.Item>
              <List.Item>
                <Text as="span">
                  <Text as="span" fontWeight="bold">Multiple conditions:</Text> &quot;product_type equals T-Shirt, tag contains summer, price greater_than 20&quot;
                </Text>
              </List.Item>
              <List.Item>
                <Text as="span">
                  <Text as="span" fontWeight="bold">Complex conditions:</Text> &quot;vendor equals Nike, inventory_quantity greater_than 0, price less_than 100&quot;
                </Text>
              </List.Item>
            </List>
          </BlockStack>
        </Card>
      </BlockStack>
    </Card>
  );
}
