import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import { ContractorCalendarEntry, ContractorCalendarEntryMiniDTO } from '../models/owns/contractorCalendarEntry';
import api from '../utils/api';
import { getInitialPage, Page, SearchCriteria } from '../models/owns/page';
import { revertAll } from 'src/utils/redux';

const basePath = 'contractor-calendar';

interface ContractorCalendarState {
  contractorCalendarEntries: Page<ContractorCalendarEntry>;
  singleContractorCalendarEntry: ContractorCalendarEntry;
  contractorCalendarEntriesMini: ContractorCalendarEntryMiniDTO[];
  loadingGet: boolean;
}

const initialState: ContractorCalendarState = {
  contractorCalendarEntries: getInitialPage<ContractorCalendarEntry>(),
  singleContractorCalendarEntry: null,
  contractorCalendarEntriesMini: [],
  loadingGet: false
};

const slice = createSlice({
  name: 'contractorCalendar',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    getContractorCalendarEntries(
      state: ContractorCalendarState,
      action: PayloadAction<{ contractorCalendarEntries: Page<ContractorCalendarEntry> }>
    ) {
      const { contractorCalendarEntries } = action.payload;
      state.contractorCalendarEntries = contractorCalendarEntries;
    },
    getSingleContractorCalendarEntry(
      state: ContractorCalendarState,
      action: PayloadAction<{ contractorCalendarEntry: ContractorCalendarEntry }>
    ) {
      const { contractorCalendarEntry } = action.payload;
      state.singleContractorCalendarEntry = contractorCalendarEntry;
    },
    editContractorCalendarEntry(state: ContractorCalendarState, action: PayloadAction<{ contractorCalendarEntry: ContractorCalendarEntry }>) {
      const { contractorCalendarEntry } = action.payload;
      const inContent = state.contractorCalendarEntries.content.some(
        (contractorCalendarEntry1) => contractorCalendarEntry1.id === contractorCalendarEntry.id
      );
      if (inContent) {
        state.contractorCalendarEntries.content = state.contractorCalendarEntries.content.map((contractorCalendarEntry1) => {
          if (contractorCalendarEntry1.id === contractorCalendarEntry.id) {
            return contractorCalendarEntry;
          }
          return contractorCalendarEntry1;
        });
      } else {
        state.singleContractorCalendarEntry = contractorCalendarEntry;
      }
    },
    getContractorCalendarEntriesMini(
      state: ContractorCalendarState,
      action: PayloadAction<{ contractorCalendarEntries: ContractorCalendarEntryMiniDTO[] }>
    ) {
      const { contractorCalendarEntries } = action.payload;
      state.contractorCalendarEntriesMini = contractorCalendarEntries;
    },
    addContractorCalendarEntry(state: ContractorCalendarState, action: PayloadAction<{ contractorCalendarEntry: ContractorCalendarEntry }>) {
      const { contractorCalendarEntry } = action.payload;
      state.contractorCalendarEntries.content = [contractorCalendarEntry, ...state.contractorCalendarEntries.content];
    },
    deleteContractorCalendarEntry(state: ContractorCalendarState, action: PayloadAction<{ id: number }>) {
      const { id } = action.payload;
      const contractorCalendarEntryIndex = state.contractorCalendarEntries.content.findIndex(
        (contractorCalendarEntry) => contractorCalendarEntry.id === id
      );
      state.contractorCalendarEntries.content.splice(contractorCalendarEntryIndex, 1);
    },
    setLoadingGet(
      state: ContractorCalendarState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingGet = loading;
    },
    clearSingleContractorCalendarEntry(state: ContractorCalendarState, action: PayloadAction<{}>) {
      state.singleContractorCalendarEntry = null;
    }
  }
});

export const reducer = slice.reducer;

export const getContractorCalendarEntries =
  (criteria: SearchCriteria): AppThunk =>
    async (dispatch) => {
      try {
        dispatch(slice.actions.setLoadingGet({ loading: true }));
        const contractorCalendarEntries = await api.post<Page<ContractorCalendarEntry>>(
          `${basePath}/search`,
          criteria
        );
        dispatch(slice.actions.getContractorCalendarEntries({ contractorCalendarEntries }));
      } finally {
        dispatch(slice.actions.setLoadingGet({ loading: false }));
      }
    };

export const getSingleContractorCalendarEntry =
  (id: number): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const contractorCalendarEntry = await api.get<ContractorCalendarEntry>(`${basePath}/${id}`);
      dispatch(slice.actions.getSingleContractorCalendarEntry({ contractorCalendarEntry }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const editContractorCalendarEntry =
  (id: number, contractorCalendarEntry): AppThunk =>
    async (dispatch) => {
      const contractorCalendarEntryResponse = await api.patch<ContractorCalendarEntry>(`${basePath}/${id}`, contractorCalendarEntry);
      dispatch(slice.actions.editContractorCalendarEntry({ contractorCalendarEntry: contractorCalendarEntryResponse }));
    };

export const getContractorCalendarEntriesMini = (): AppThunk => async (dispatch) => {
  const contractorCalendarEntries = await api.get<ContractorCalendarEntry[]>(`${basePath}/mini`);
  dispatch(slice.actions.getContractorCalendarEntriesMini({ contractorCalendarEntries }));
};

export const addContractorCalendarEntry =
  (contractorCalendarEntry): AppThunk =>
    async (dispatch) => {
      const contractorCalendarEntryResponse = await api.post<ContractorCalendarEntry>(basePath, contractorCalendarEntry);
      dispatch(slice.actions.addContractorCalendarEntry({ contractorCalendarEntry: contractorCalendarEntryResponse }));
    };

export const deleteContractorCalendarEntry =
  (id: number): AppThunk =>
    async (dispatch) => {
      const contractorCalendarEntryResponse = await api.deletes<{ success: boolean }>(
        `${basePath}/${id}`
      );
      const { success } = contractorCalendarEntryResponse;
      if (success) {
        dispatch(slice.actions.deleteContractorCalendarEntry({ id }));
      }
    };

export const getContractorCalendarEntriesByVendor =
  (vendorId: number): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const contractorCalendarEntries = await api.get<ContractorCalendarEntry[]>(`${basePath}/vendor/${vendorId}`);
      const page: Page<ContractorCalendarEntry> = {
        content: contractorCalendarEntries,
        totalElements: contractorCalendarEntries.length,
        totalPages: 1,
        last: true,
        size: contractorCalendarEntries.length,
        number: 0,
        numberOfElements: contractorCalendarEntries.length,
        first: true,
        empty: contractorCalendarEntries.length === 0,
        sort: { empty: true, sorted: true, unsorted: false }
      };
      dispatch(slice.actions.getContractorCalendarEntries({ contractorCalendarEntries: page }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const getContractorCalendarEntriesByEmployee =
  (employeeId: number): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const contractorCalendarEntries = await api.get<ContractorCalendarEntry[]>(`${basePath}/employee/${employeeId}`);
      const page: Page<ContractorCalendarEntry> = {
        content: contractorCalendarEntries,
        totalElements: contractorCalendarEntries.length,
        totalPages: 1,
        last: true,
        size: contractorCalendarEntries.length,
        number: 0,
        numberOfElements: contractorCalendarEntries.length,
        first: true,
        empty: contractorCalendarEntries.length === 0,
        sort: { empty: true, sorted: true, unsorted: false }
      };
      dispatch(slice.actions.getContractorCalendarEntries({ contractorCalendarEntries: page }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const getContractorCalendarEntriesByWorkOrder =
  (workOrderId: number): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const contractorCalendarEntries = await api.get<ContractorCalendarEntry[]>(`${basePath}/work-order/${workOrderId}`);
      const page: Page<ContractorCalendarEntry> = {
        content: contractorCalendarEntries,
        totalElements: contractorCalendarEntries.length,
        totalPages: 1,
        last: true,
        size: contractorCalendarEntries.length,
        number: 0,
        numberOfElements: contractorCalendarEntries.length,
        first: true,
        empty: contractorCalendarEntries.length === 0,
        sort: { empty: true, sorted: true, unsorted: false }
      };
      dispatch(slice.actions.getContractorCalendarEntries({ contractorCalendarEntries: page }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const getContractorCalendarEntriesByDateRange =
  (start: string, end: string): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const contractorCalendarEntries = await api.get<ContractorCalendarEntry[]>(`${basePath}/date-range?start=${start}&end=${end}`);
      const page: Page<ContractorCalendarEntry> = {
        content: contractorCalendarEntries,
        totalElements: contractorCalendarEntries.length,
        totalPages: 1,
        last: true,
        size: contractorCalendarEntries.length,
        number: 0,
        numberOfElements: contractorCalendarEntries.length,
        first: true,
        empty: contractorCalendarEntries.length === 0,
        sort: { empty: true, sorted: true, unsorted: false }
      };
      dispatch(slice.actions.getContractorCalendarEntries({ contractorCalendarEntries: page }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const createContractorCalendarEntryFromWorkOrder =
  (workOrderId: number, employeeId: number, supervisorId: number): AppThunk =>
    async (dispatch) => {
      const contractorCalendarEntry = await api.post<ContractorCalendarEntry>(
        `${basePath}/from-work-order?workOrderId=${workOrderId}&employeeId=${employeeId}&supervisorId=${supervisorId}`,
        {}
      );
      dispatch(slice.actions.addContractorCalendarEntry({ contractorCalendarEntry }));
    };

export const clearSingleContractorCalendarEntry = (): AppThunk => async (dispatch) => {
  dispatch(slice.actions.clearSingleContractorCalendarEntry({}));
};

export default slice;