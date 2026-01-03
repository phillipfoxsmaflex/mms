export enum HotspotIconType {
  DEFAULT = 'DEFAULT',
  MACHINE = 'MACHINE',
  SENSOR = 'SENSOR',
  PUMP = 'PUMP',
  MOTOR = 'MOTOR',
  VALVE = 'VALVE',
  TANK = 'TANK',
  CONVEYOR = 'CONVEYOR',
  HVAC = 'HVAC',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  SAFETY = 'SAFETY',
  MONITORING = 'MONITORING'
}

export interface AssetHotspot {
  id: number;
  assetId: number;
  assetName: string;
  locationImageId: number;
  xPosition: number;
  yPosition: number;
  label?: string;
  iconType: HotspotIconType;
  color: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateAssetHotspotRequest {
  assetId: number;
  locationImageId: number;
  xPosition: number;
  yPosition: number;
  label?: string;
  iconType?: HotspotIconType;
  color?: string;
}

export interface UpdateAssetHotspotRequest {
  xPosition?: number;
  yPosition?: number;
  label?: string;
  iconType?: HotspotIconType;
  color?: string;
}
