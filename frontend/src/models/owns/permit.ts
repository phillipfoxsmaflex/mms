import { Audit } from './audit';
import File from './file';
import Team from './team';
import { UserMiniDTO } from '../user';

export type PermitStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PermitType =
  | 'HOT_WORK'
  | 'CONFINED_SPACE'
  | 'ELECTRICAL'
  | 'EXCAVATION'
  | 'WORKING_AT_HEIGHT'
  | 'COLD_WORK'
  | 'CHEMICAL_HANDLING'
  | 'LOCKOUT_TAGOUT'
  | 'RADIATION'
  | 'GENERAL'
  | 'OTHER';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PermitLocation extends Audit {
  id: number;
  name: string;
  description: string;
  facility: string;
  building: string;
  floor: string;
  area: string;
  latitude: number;
  longitude: number;
  address: string;
  active: boolean;
}

export interface PermitLocationMiniDTO {
  id: number;
  name: string;
  facility: string;
  building: string;
}

export default interface Permit extends Audit {
  id: number;
  customId: number;
  title: string;
  description: string;
  permitType: PermitType;
  status: PermitStatus;
  riskLevel: RiskLevel;
  permitLocation: PermitLocationMiniDTO;
  startDate: string;
  endDate: string;
  safetyRequirements: string;
  equipmentNeeded: string;
  hazardsIdentified: string;
  controlMeasures: string;
  emergencyProcedures: string;
  ppeRequired: string;
  specialInstructions: string;
  rejectionReason: string;
  cancellationReason: string;
  assignedUsers: UserMiniDTO[];
  teams: Team[];
  files: File[];
  approvedBy: UserMiniDTO;
  approvedAt: string;
  completedBy: UserMiniDTO;
  completedAt: string;
}

export interface PermitMiniDTO {
  id: number;
  customId: number;
  title: string;
  status: PermitStatus;
  permitType: PermitType;
  riskLevel: RiskLevel;
  startDate: string;
  endDate: string;
}
