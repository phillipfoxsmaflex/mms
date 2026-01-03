export interface Document {
  id: number;
  name: string;
  description?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  createdById?: number;
  createdByName?: string;
  organizationId: number;
  parentDocumentId?: number;
  isFolder: boolean;
  entityType: 'LOCATION' | 'ASSET' | 'WORK_ORDER';
  entityId: number;
  tags?: string[];
  version: number;
  isActive: boolean;
  children?: Document[];
}

export interface DocumentMiniDTO {
  id: number;
  name: string;
  isFolder: boolean;
  mimeType?: string;
}
