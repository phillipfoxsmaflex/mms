import { Audit } from './audit';

export interface ContractorEmployee extends Audit {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  vendorId: number;
  currentSafetyInstructionId: number;
}

export interface ContractorEmployeeMiniDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export const contractorEmployees: ContractorEmployee[] = [
  {
    id: 1,
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max.mustermann@example.com',
    phone: '+49123456789',
    position: 'Techniker',
    vendorId: 1,
    currentSafetyInstructionId: 1,
    createdBy: 1,
    updatedBy: 1,
    createdAt: '2023-01-10T08:00:00',
    updatedAt: '2023-01-10T08:00:00'
  }
];