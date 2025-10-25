interface UploadingSectionProps {
  useBulkOperations: boolean;
}

export const UploadingSection: React.FC<UploadingSectionProps> = ({
  useBulkOperations,
}) => {
  return (
    <s-stack direction="block" gap="base">
      <s-box padding="base" background="base" border="base" borderRadius="base">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base">
            <s-spinner size="base" />
            <p className="text-sm text-gray-500">
              {useBulkOperations
                ? "Creating bulk operation..."
                : "Uploading and processing file..."}
            </p>
          </s-stack>

          <p className="text-xs text-gray-500">
            This may take a few moments. Please don&apos;t close this page.
          </p>
        </s-stack>
      </s-box>
    </s-stack>
  );
};
