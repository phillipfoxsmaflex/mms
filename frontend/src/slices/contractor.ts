import { Vendor, VendorMiniDTO } from '../models/owns/vendor';
import { RootState } from '../store';
import { getVendors } from './vendor';
import { SearchCriteria } from '../models/owns/page';

// Selector to filter vendors by contractor type
export const selectContractorVendors = (state: RootState): VendorMiniDTO[] => {
  // Try to get full vendor data first (for filtering by type)
  const vendorsPage = state.vendors.vendors;
  const allVendors = vendorsPage?.content || [];
  
  // If we have full vendor data, filter by contractor type
  if (allVendors.length > 0) {
    return allVendors
      .filter(vendor => {
        const type = vendor?.vendorType ? vendor.vendorType.toLowerCase() : '';
        return type.includes('auftragnehmer') || 
               type.includes('contractor') ||
               type.includes('extern');
      })
      .map(vendor => ({ 
        id: vendor.id, 
        companyName: vendor.companyName 
      }));
  }
  
  // Fallback: if no full vendor data, use mini DTOs (show all vendors)
  return state.vendors.vendorsMini || [];
};

// Action to load vendors and filter for contractors
export const loadContractorVendors = (): any => async (dispatch: any) => {
  try {
    // Load full vendor data to get vendorType information
    const criteria: SearchCriteria = {
      pageNum: 0,
      pageSize: 100,
      sortField: 'id',
      direction: 'ASC',
      filterFields: []
    };
    
    dispatch(getVendors(criteria));
  } catch (error) {
    console.error('Failed to load contractor vendors:', error);
  }
};

