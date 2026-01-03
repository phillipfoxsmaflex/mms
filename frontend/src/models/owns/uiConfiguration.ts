export interface UiConfiguration {
  id: number;
  workOrders: boolean;
  preventiveMaintenance: boolean;
  permitToWork: boolean;
  statistics: boolean;
  requests: boolean;
  assets: boolean;
  locations: boolean;
  partsAndInventory: boolean;
  purchaseOrders: boolean;
  meters: boolean;
  peopleTeams: boolean;
  vendorsAndCustomers: boolean;
  categories: boolean;
  files: boolean;
  settings: boolean;
  customLogo?: string | null;
}
