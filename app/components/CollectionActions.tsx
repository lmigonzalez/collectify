import { Card, Text, Button, ButtonGroup, BlockStack } from "@shopify/polaris";
import { useRouter } from "next/navigation";

export default function CollectionActions() {
  const router = useRouter();

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Collection Actions
        </Text>
        <Text as="p" tone="subdued">
          Manage your product collections with upload, download, and template
          features.
        </Text>

        <ButtonGroup>
          <Button
            variant="secondary"
            onClick={() => router.push("/collections/upload")}
          >
            Upload Collections
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/collections/download")}
          >
            Download Collections
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push("/collections/create")}
          >
            Create Collection
          </Button>
        </ButtonGroup>
      </BlockStack>
    </Card>
  );
}
