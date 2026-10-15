export type DocumentStatus = "active" | "expiring" | "expired" | "archived";

export type DocumentCategory = "ID" | "Contract" | "Certificate" | "Policy" | "Template" | "Agreement" | "Other";

export interface DocumentItem {
  id: string;
  name: string;
  category: DocumentCategory;
  employee?: { id: string; name: string } | null;
  uploadedAt: string;
  expiryDate?: string;
  status: DocumentStatus;
  version: number;
  fileType: "pdf" | "docx" | "image";
  sizeKB?: number;
}
