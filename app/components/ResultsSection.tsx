import React from "react";
import { UploadResult } from "../../types/upload";

interface ResultsSectionProps {
  uploadResult: UploadResult;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  uploadResult,
}) => {
  return (
    <s-stack direction="block" gap="base">
      <s-box padding="base" background="base" border="base" borderRadius="base">
        <s-stack direction="block" gap="base">
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
            <s-stack direction="block" gap="base">
              <s-text type="strong">
                <strong>Details:</strong>
              </s-text>
              <s-stack direction="block" gap="base">
                {uploadResult.results.slice(0, 10).map((result, index) => (
                  <p key={index} className="text-xs text-gray-500">
                    Row {result.row}: {result.title} -{" "}
                    {result.status === "success" ? "✅" : "❌"} {result.message}
                  </p>
                ))}
                {uploadResult.results.length > 10 && (
                  <p className="text-xs text-gray-500">
                    ... and {uploadResult.results.length - 10} more results
                  </p>
                )}
              </s-stack>
            </s-stack>
          )}
        </s-stack>
      </s-box>
    </s-stack>
  );
};
