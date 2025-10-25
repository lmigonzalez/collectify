"use client";

import { Collection } from "../../types/collections";
import {
  Card,
  Text,
  DataTable,
  Badge,
  Button,
  ButtonGroup,
  InlineStack,
  BlockStack,
} from "@shopify/polaris";

interface CollectionsTableProps {
  collections: Collection[];
}

export default function CollectionsTable({
  collections,
}: CollectionsTableProps) {
  const rows = collections.map((collection) => [
    <InlineStack key="title" gap="100">
      <Text as="span" fontWeight="bold">
        {collection.title}
      </Text>
      <Text as="span" tone="subdued">
        ({collection.handle})
      </Text>
    </InlineStack>,
    <Badge key="type" tone={collection.type === "Smart" ? "info" : "success"}>
      {collection.type}
    </Badge>,
    <Text key="products" as="span">
      {collection.productCount} products
    </Text>,
    <Badge key="status" tone={collection.published ? "success" : "warning"}>
      {collection.published ? "Published" : "Draft"}
    </Badge>,
    <ButtonGroup key="actions">
      <Button variant="primary" size="slim">
        Edit
      </Button>
      <Button variant="secondary" size="slim">
        View
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Your Collections
        </Text>
        <Text as="p" tone="subdued">
          View and manage all your product collections. {collections.length}{" "}
          collection{collections.length !== 1 ? "s" : ""} found.
        </Text>

        <DataTable
          columnContentTypes={["text", "text", "text", "text", "text"]}
          headings={["Collection", "Type", "Products", "Status", "Actions"]}
          rows={rows}
        />
      </BlockStack>
    </Card>
  );
}
