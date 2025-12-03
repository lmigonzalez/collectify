"use client";

import React, { useState, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ProgressSteps } from "../../../components/ProgressSteps";
import { UploadSection } from "../../../components/UploadSection";
import { PreviewSection } from "../../../components/PreviewSection";
import { UploadingSection } from "../../../components/UploadingSection";
import { ResultsSection } from "../../../components/ResultsSection";
import { BulkStatusSection } from "../../../components/BulkStatusSection";
import { parseCSVForPreview } from "../../../../lib/csv-utils";
import {
  UploadResult,
  BulkOperationStatus,
  BulkUploadResult,
  CSVPreviewData,
  UploadStep,
} from "../../../../types/upload";

export default function UploadPage() {
  const appBridge = useAppBridge();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [bulkUploadResult, setBulkUploadResult] =
    useState<BulkUploadResult | null>(null);
  const [bulkOperationStatus, setBulkOperationStatus] =
    useState<BulkOperationStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useBulkOperations, setUseBulkOperations] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CSVPreviewData | null>(null);
  const [currentStep, setCurrentStep] = useState<UploadStep>({
    step: "upload",
    title: "Upload CSV File",
    description: "Choose a CSV file containing collection data to import",
  });
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    setSelectedFile(file);
    setIsValidating(true);

    try {
      const csvContent = await file.text();
      const preview = parseCSVForPreview(csvContent);
      setCsvPreview(preview);

      if (preview.errors.length > 0) {
        setCurrentStep({
          step: "preview",
          title: "Review CSV Data",
          description: "Please fix the errors below before proceeding",
        });
      } else {
        setCurrentStep({
          step: "preview",
          title: "Review CSV Data",
          description: `Found ${preview.validRows} valid collections ready to import`,
        });
      }
    } catch (error) {
      console.error("CSV parsing error:", error);
      setCsvPreview({
        headers: [],
        rows: [],
        totalRows: 0,
        validRows: 0,
        errors: ["Failed to parse CSV file"],
      });
      setCurrentStep({
        step: "preview",
        title: "Review CSV Data",
        description: "Please fix the errors below before proceeding",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setCurrentStep({
      step: "uploading",
      title: "Uploading Collections",
      description: "Please wait while your collections are being imported...",
    });
    setUploadResult(null);
    setBulkUploadResult(null);
    setBulkOperationStatus(null);

    try {
      // Get JWT token from App Bridge for authentication
      const token = await appBridge.idToken();
      
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Choose endpoint based on user preference
      const endpoint = useBulkOperations
        ? "/api/collections/import-bulk"
        : "/api/collections/import";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (useBulkOperations) {
        const result: BulkUploadResult = await response.json();
        setBulkUploadResult(result);

        if (result.success && result.bulkOperationId) {
          setCurrentStep({
            step: "complete",
            title: "Upload Complete",
            description:
              "Your collections are being processed in the background",
          });
          // Start polling for status
          checkBulkOperationStatus(result.bulkOperationId);
        } else {
          setCurrentStep({
            step: "complete",
            title: "Upload Failed",
            description: result.error || "An error occurred during upload",
          });
        }
      } else {
        const result: UploadResult = await response.json();
        setUploadResult(result);
        setCurrentStep({
          step: "complete",
          title: result.success ? "Upload Complete" : "Upload Failed",
          description: result.success
            ? `Successfully created ${result.created} collections`
            : result.error || "An error occurred during upload",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setCurrentStep({
        step: "complete",
        title: "Upload Failed",
        description: "Network error occurred",
      });

      if (useBulkOperations) {
        setBulkUploadResult({
          success: false,
          message: "Failed to upload file",
          error: "Network error occurred",
        });
      } else {
        setUploadResult({
          success: false,
          created: 0,
          updated: 0,
          errors: 1,
          results: [
            {
              row: 0,
              title: "",
              status: "error",
              message: "Failed to upload file",
            },
          ],
          error: "Network error occurred",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const checkBulkOperationStatus = async (bulkOperationId: string) => {
    setIsCheckingStatus(true);

    try {
      // Get JWT token from App Bridge for authentication
      const token = await appBridge.idToken();
      
      const response = await fetch(
        `/api/collections/bulk-status?id=${bulkOperationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (result.success && result.bulkOperation) {
        setBulkOperationStatus(result.bulkOperation);

        // If still running, check again in 5 seconds
        if (
          result.bulkOperation.status === "RUNNING" ||
          result.bulkOperation.status === "CREATED"
        ) {
          setTimeout(() => checkBulkOperationStatus(bulkOperationId), 5000);
        }
      }
    } catch (error) {
      console.error("Status check error:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleBulkOperationsChange = (useBulk: boolean) => {
    setUseBulkOperations(useBulk);
  };

  const handleDropRejected = (event: Event) => {
    console.log("File rejected:", event);
    alert("Please select a valid CSV file");
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setBulkUploadResult(null);
    setBulkOperationStatus(null);
    setCsvPreview(null);
    setCurrentStep({
      step: "upload",
      title: "Upload CSV File",
      description: "Choose a CSV file containing collection data to import",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const goBackToUpload = () => {
    setCsvPreview(null);
    setCurrentStep({
      step: "upload",
      title: "Upload CSV File",
      description: "Choose a CSV file containing collection data to import",
    });
  };

  return (
    <s-page heading="Upload Collections from CSV">
      <s-stack direction="block" gap="base" padding="base">
        <s-box
          padding="base"
          background="base"
          border="base"
          borderRadius="base"
        >
          <ProgressSteps currentStep={currentStep} />
        </s-box>

        {/* Upload Step */}
        {currentStep.step === "upload" && (
          <UploadSection
            useBulkOperations={useBulkOperations}
            onBulkOperationsChange={handleBulkOperationsChange}
            onFileUpload={handleFileUpload}
            onDropRejected={handleDropRejected}
          />
        )}

        {/* Preview Step */}
        {currentStep.step === "preview" && csvPreview && (
          <s-box>
            <PreviewSection
              csvPreview={csvPreview}
              selectedFile={selectedFile}
              isValidating={isValidating}
              onConfirmUpload={handleConfirmUpload}
              onGoBack={goBackToUpload}
            />
          </s-box>
        )}

        {/* Uploading Step */}
        {currentStep.step === "uploading" && (
          <UploadingSection useBulkOperations={useBulkOperations} />
        )}

        {/* Results */}
        {uploadResult && <ResultsSection uploadResult={uploadResult} />}

        <BulkStatusSection
          bulkUploadResult={bulkUploadResult}
          bulkOperationStatus={bulkOperationStatus}
          isCheckingStatus={isCheckingStatus}
        />

        {/* Action Buttons */}
        <div className="flex gap-3" slot="primary-action">
          {currentStep.step === "complete" && (
            <s-button variant="primary" onClick={resetUpload}>
              Upload Another File
            </s-button>
          )}
          {currentStep.step === "uploading" && (
            <s-button variant="secondary" onClick={resetUpload} disabled>
              Cancel Upload
            </s-button>
          )}
        </div>
      </s-stack>
    </s-page>
  );
}
