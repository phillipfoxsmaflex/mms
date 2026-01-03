import { Audit } from './audit';
import { UserMiniDTO } from '../user';
import { PermitMiniDTO } from './permit';

export type MocStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTATION'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export type MocType =
  | 'PROCESS_CHANGE'
  | 'EQUIPMENT_CHANGE'
  | 'PROCEDURE_CHANGE'
  | 'PERSONNEL_CHANGE'
  | 'MATERIAL_CHANGE'
  | 'TECHNOLOGY_CHANGE'
  | 'ORGANIZATIONAL_CHANGE'
  | 'OTHER';

export type MocActionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export type MocApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';

export interface MocChangeRequest extends Audit {
  id: number;
  title: string;
  description: string;
  changeType: string;
  reasonForChange: string;
  riskAssessment: string;
  impactAnalysis: string;
  status: MocStatus;
  priority: string;
  permit: PermitMiniDTO;
  requestedBy: UserMiniDTO;
  approvedBy: UserMiniDTO;
  approvedAt: string;
  implementedBy: UserMiniDTO;
  implementedAt: string;
  closedBy: UserMiniDTO;
  closedAt: string;
  rejectionReason: string;
  targetImplementationDate: string;
  actualImplementationDate: string;
}

// Alias for backward compatibility
export type ManagementOfChange = MocChangeRequest;

export interface MocChangeRequestMiniDTO {
  id: number;
  title: string;
  status: MocStatus;
  changeType: string;
  priority: string;
}

export interface MocAction extends Audit {
  id: number;
  title: string;
  description: string;
  status: MocActionStatus;
  priority: string;
  mocChangeRequest: MocChangeRequestMiniDTO;
  assignedTo: UserMiniDTO;
  dueDate: string;
  completedAt: string;
  completionNotes: string;
}

export interface MocApproval extends Audit {
  id: number;
  status: MocApprovalStatus;
  approvalLevel: number;
  mocChangeRequest: MocChangeRequestMiniDTO;
  approver: UserMiniDTO;
  approvedAt: string;
  comments: string;
  rejectionReason: string;
}
