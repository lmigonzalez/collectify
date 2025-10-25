import React from "react";
import { CSVPreviewData } from "../../types/upload";

interface PreviewSectionProps {
  csvPreview: CSVPreviewData;
  selectedFile: File | null;
  isValidating: boolean;
  onConfirmUpload: () => void;
  onGoBack: () => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  csvPreview,
  selectedFile,
  isValidating,
  onConfirmUpload,
  onGoBack,
}) => {
  return (
    <s-stack direction="block" gap="base">
      <s-box padding="base" background="base" border="base" borderRadius="base">
        <s-stack direction="block" gap="base">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">CSV Preview</h3>
            <s-button variant="secondary" onClick={onGoBack}>
              Choose Different File
            </s-button>
          </div>

          <div className="flex gap-6 mb-6">
            <p className="text-sm text-gray-500">
              <strong>File:</strong> {selectedFile?.name} (
              {((selectedFile?.size || 0) / 1024).toFixed(2)} KB)
            </p>
            <p className="text-sm text-gray-500">
              <strong>Rows:</strong> {csvPreview.totalRows} total,{" "}
              {csvPreview.validRows} valid
            </p>
          </div>

          {/* Validation Errors */}
          {csvPreview.errors.length > 0 && (
            <s-banner tone="critical">
              <div className="p-3">
                {csvPreview.errors.map((error, index) => (
                  <p key={index} className="text-sm text-gray-500 mb-2">
                    {error}
                  </p>
                ))}
              </div>
            </s-banner>
          )}

          {/* CSV Preview Table */}
          {csvPreview.rows.length > 0 && (
            <div className="mb-6">
              <div className="overflow-auto max-h-[400px] border border-gray-200 rounded-md">
                <s-table>
                  <thead>
                    <s-table-row>
                      {csvPreview.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </s-table-row>
                  </thead>
                  <s-table-body>
                    {csvPreview.rows.slice(0, 10).map((row, rowIndex) => (
                      <s-table-row key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <s-table-cell key={cellIndex}>
                            {cell.replace(/"/g, "")}
                          </s-table-cell>
                        ))}
                      </s-table-row>
                    ))}
                  </s-table-body>
                </s-table>
              </div>
              {csvPreview.rows.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  ... and {csvPreview.rows.length - 10} more rows
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <s-button
              variant="primary"
              onClick={onConfirmUpload}
              disabled={csvPreview.errors.length > 0 || isValidating}
            >
              {isValidating ? "Validating..." : "Confirm Upload"}
            </s-button>
            <s-button variant="secondary" onClick={onGoBack}>
              Cancel
            </s-button>
          </div>
        </s-stack>
      </s-box>
    </s-stack>
  );
};
