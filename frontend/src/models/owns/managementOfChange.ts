import { UserMiniDTO } from '../user';
import { Audit } from './audit';
import { PermitMiniDTO } from './permit';

export enum MocStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum ChangeType {
  EQUIPMENT = 'EQUIPMENT',
  PROCESS = 'PROCESS',
  MATERIAL = 'MATERIAL',
  PERSONNEL = 'PERSONNEL',
  PROCEDURE = 'PROCEDURE',
  OTHER = 'OTHER'
}

export interface ManagementOfChange extends Audit {
  id: number;
  permit: PermitMiniDTO;
  changeType: ChangeType;
  title: string;
  description: string;
  riskAssessment: string;
  status: MocStatus;
  approvedBy: UserMiniDTO;
  approvedAt: string;
  rejectedAt: string;
  rejectionReason: string;
}

export interface ManagementOfChangeMiniDTO {
  id: number;
  title: string;
  status: MocStatus;
}
