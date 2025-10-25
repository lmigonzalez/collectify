import React from "react";

interface UploadSectionProps {
  useBulkOperations: boolean;
  onBulkOperationsChange: (useBulk: boolean) => void;
  onFileUpload: (file: File) => void;
  onDropRejected: (event: Event) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  useBulkOperations,
  onBulkOperationsChange,
  onFileUpload,
  onDropRejected,
}) => {
  const handleDropZoneInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDropZoneChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <s-stack direction="block" gap="base">
      <s-box padding="base" background="base" border="base" borderRadius="base">
        <s-stack direction="block" gap="base">
          <s-text type="strong">
            Upload a CSV file to import collections into your store. The file
            should contain collection data with proper headers.
          </s-text>

          <s-stack direction="inline" gap="base small" alignItems="center">
            <s-checkbox
              label="Use Bulk Operations (Recommended for large files)"
              checked={useBulkOperations}
              onChange={(e) =>
                onBulkOperationsChange(
                  (e.currentTarget as unknown as HTMLInputElement).checked
                )
              }
            />

            <s-text type="strong">
              {useBulkOperations
                ? "Faster processing, no rate limits, asynchronous processing. Best for files with 10+ collections."
                : "Synchronous processing, immediate results. Best for small files with <10 collections."}
            </s-text>
          </s-stack>

          <s-drop-zone
            label="Choose CSV file"
            accessibilityLabel="Upload CSV file containing collection data"
            accept=".csv"
            onInput={handleDropZoneInput}
            onChange={handleDropZoneChange}
            onDropRejected={onDropRejected}
          />
        </s-stack>
      </s-box>
    </s-stack>
  );
};
