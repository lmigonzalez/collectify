import React from "react";
import { BulkUploadResult, BulkOperationStatus } from "../../types/upload";

interface BulkStatusSectionProps {
  bulkUploadResult: BulkUploadResult | null;
  bulkOperationStatus: BulkOperationStatus | null;
  isCheckingStatus: boolean;
}

export const BulkStatusSection: React.FC<BulkStatusSectionProps> = ({
  bulkUploadResult,
  bulkOperationStatus,
  isCheckingStatus,
}) => {
  if (!bulkUploadResult && !bulkOperationStatus) {
    return null;
  }

  return (
    <>
      {bulkUploadResult && (
        <s-stack direction="block" gap="base">
          <s-box
            padding="base"
            background="base"
            border="base"
            borderRadius="base"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Bulk Operation Status
              </h3>

              <s-banner
                tone={bulkUploadResult.success ? "success" : "critical"}
              >
                <p className="text-sm text-gray-500">
                  {bulkUploadResult.message}
                </p>
              </s-banner>

              {bulkUploadResult.bulkOperationId && (
                <p className="text-xs text-gray-500 mt-4">
                  Operation ID: {bulkUploadResult.bulkOperationId}
                </p>
              )}
            </div>
          </s-box>
        </s-stack>
      )}

      {bulkOperationStatus && (
        <s-stack direction="block" gap="base">
          <s-box
            padding="base"
            background="base"
            border="base"
            borderRadius="base"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Operation Progress
              </h3>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Status:</span>
                <span
                  className={`text-sm font-bold ${
                    bulkOperationStatus.status === "COMPLETED"
                      ? "text-green-500"
                      : bulkOperationStatus.status === "FAILED"
                      ? "text-red-500"
                      : "text-orange-500"
                  }`}
                >
                  {bulkOperationStatus.status}
                </span>
              </div>

              {bulkOperationStatus.objectCount && (
                <p className="text-sm text-gray-500 mb-4">
                  Processed: {bulkOperationStatus.objectCount} collections
                </p>
              )}

              {bulkOperationStatus.status === "COMPLETED" &&
                bulkOperationStatus.url && (
                  <s-button
                    variant="primary"
                    onClick={() =>
                      window.open(bulkOperationStatus.url, "_blank")
                    }
                  >
                    Download Results
                  </s-button>
                )}

              {bulkOperationStatus.status === "FAILED" &&
                bulkOperationStatus.errorCode && (
                  <s-banner tone="critical">
                    <p className="text-sm text-gray-500">
                      Error Code: {bulkOperationStatus.errorCode}
                    </p>
                  </s-banner>
                )}

              {isCheckingStatus && (
                <div className="flex items-center gap-2 mt-4">
                  <s-spinner size="base" />
                  <span className="text-xs text-gray-500">
                    Checking status...
                  </span>
                </div>
              )}
            </div>
          </s-box>
        </s-stack>
      )}
    </>
  );
};
