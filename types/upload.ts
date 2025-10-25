export interface UploadResult {
  success: boolean;
  created: number;
  updated: number;
  errors: number;
  results: {
    row: number;
    title: string;
    status: "success" | "error";
    message: string;
    collectionId?: string;
  }[];
  error?: string;
}

export interface BulkOperationStatus {
  id: string;
  status: string;
  errorCode?: string;
  createdAt: string;
  completedAt?: string;
  objectCount?: string;
  fileSize?: string;
  url?: string;
  partialDataUrl?: string;
}

export interface BulkUploadResult {
  success: boolean;
  bulkOperationId?: string;
  message: string;
  error?: string;
}

export interface CSVPreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  validRows: number;
  errors: string[];
}

export interface UploadStep {
  step: "upload" | "preview" | "uploading" | "complete";
  title: string;
  description: string;
}
