import React from "react";
import { UploadResult } from "../../types/upload";
import "../../types/shopify-components";

interface ResultsSectionProps {
  uploadResult: UploadResult;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  uploadResult,
}) => {
  return (
    <s-layout-section>
      <s-card>
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Upload Results
          </h3>

          <s-banner tone={uploadResult.success ? "success" : "critical"}>
            <p className="text-sm text-gray-500">
              ✅ Created: {uploadResult.created} | ❌ Errors:{" "}
              {uploadResult.errors}
            </p>
          </s-banner>

          {uploadResult.results.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">
                <strong>Details:</strong>
              </p>
              <div className="flex flex-col gap-1">
                {uploadResult.results
                  .slice(0, 10)
                  .map((result, index) => (
                    <p key={index} className="text-xs text-gray-500">
                      Row {result.row}: {result.title} -{" "}
                      {result.status === "success" ? "✅" : "❌"}{" "}
                      {result.message}
                    </p>
                  ))}
                {uploadResult.results.length > 10 && (
                  <p className="text-xs text-gray-500">
                    ... and {uploadResult.results.length - 10} more results
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </s-card>
    </s-layout-section>
  );
};
