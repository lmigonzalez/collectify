import React from "react";
import "../../types/shopify-components";

interface UploadingSectionProps {
  useBulkOperations: boolean;
}

export const UploadingSection: React.FC<UploadingSectionProps> = ({
  useBulkOperations,
}) => {
  return (
    <s-layout-section>
      <s-card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <s-spinner size="base" />
            <p className="text-sm text-gray-500">
              {useBulkOperations
                ? "Creating bulk operation..."
                : "Uploading and processing file..."}
            </p>
          </div>

          <p className="text-xs text-gray-500">
            This may take a few moments. Please don&apos;t close this page.
          </p>
        </div>
      </s-card>
    </s-layout-section>
  );
};
