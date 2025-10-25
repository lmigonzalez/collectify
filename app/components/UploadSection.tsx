import React from "react";
import "../../types/shopify-components";

interface UploadSectionProps {
  useBulkOperations: boolean;
  onBulkOperationsChange: (useBulk: boolean) => void;
  onFileUpload: (file: File) => void;
  onDropRejected: (event: React.FormEvent<HTMLElement>) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  useBulkOperations,
  onBulkOperationsChange,
  onFileUpload,
  onDropRejected,
}) => {
  const handleDropZoneInput = (event: React.FormEvent<HTMLElement>) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDropZoneChange = (event: React.FormEvent<HTMLElement>) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <s-layout-section>
      <s-card>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-4">
              Upload a CSV file to import collections into your store. The file
              should contain collection data with proper headers.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label className="flex items-center gap-2 mb-2">
                <s-checkbox
                  checked={useBulkOperations}
                  onChange={(e) =>
                    onBulkOperationsChange((e.currentTarget as unknown as HTMLInputElement).checked)
                  }
                />
                <span className="text-sm text-gray-500">
                  Use Bulk Operations (Recommended for large files)
                </span>
              </label>

              <p className="text-xs text-gray-500">
                {useBulkOperations
                  ? "Faster processing, no rate limits, asynchronous processing. Best for files with 10+ collections."
                  : "Synchronous processing, immediate results. Best for small files with <10 collections."}
              </p>
            </div>

            <s-drop-zone
              label="Choose CSV file"
              accessibilityLabel="Upload CSV file containing collection data"
              accept=".csv"
              onInput={handleDropZoneInput}
              onChange={handleDropZoneChange}
              onDropRejected={onDropRejected}
            />
          </div>
        </div>
      </s-card>
    </s-layout-section>
  );
};
