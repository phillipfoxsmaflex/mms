import { Audit } from './audit';

export type CalendarEntryStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ContractorCalendarEntry extends Audit {
  id: number;
  vendorId: number;
  workOrderId: number;
  employeeId: number;
  supervisorId: number;
  startTime: string;
  endTime: string;
  description: string;
  locationDetails: string;
  status: CalendarEntryStatus;
}

export interface ContractorCalendarEntryMiniDTO {
  id: number;
  startTime: string;
  endTime: string;
  description: string;
  status: CalendarEntryStatus;
}

export const contractorCalendarEntries: ContractorCalendarEntry[] = [
  {
    id: 1,
    vendorId: 1,
    workOrderId: 1,
    employeeId: 1,
    supervisorId: 1,
    startTime: '2023-02-01T08:00:00',
    endTime: '2023-02-01T17:00:00',
    description: 'Wartungsarbeit an Maschine A',
    locationDetails: 'Halle 1, Standort A',
    status: 'PLANNED',
    createdBy: 1,
    updatedBy: 1,
    createdAt: '2023-01-25T08:00:00',
    updatedAt: '2023-01-25T08:00:00'
  }
];