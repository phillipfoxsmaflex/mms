import { AssetHotspot } from './assetHotspot';

export default interface LocationImage {
  id: number;
  name: string;
  description?: string;
  fileId: number;
  fileUrl: string;
  locationId: number;
  locationName: string;
  createdAt: string;
  updatedAt: string;
  createdById?: number;
  createdByName?: string;
  isActive: boolean;
  hotspots?: AssetHotspot[];
}

export interface LocationImageMiniDTO {
  id: number;
  name: string;
  fileUrl: string;
  locationId: number;
}

export interface CreateLocationImageRequest {
  name: string;
  description?: string;
  locationId: number;
}
