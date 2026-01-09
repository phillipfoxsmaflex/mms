import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import { ContractorEmployee, ContractorEmployeeMiniDTO } from '../models/owns/contractorEmployee';
import api from '../utils/api';
import { getInitialPage, Page, SearchCriteria } from '../models/owns/page';
import { revertAll } from 'src/utils/redux';

const basePath = 'contractor-employees';

interface ContractorEmployeeState {
  contractorEmployees: Page<ContractorEmployee>;
  singleContractorEmployee: ContractorEmployee;
  contractorEmployeesMini: ContractorEmployeeMiniDTO[];
  loadingGet: boolean;
}

const initialState: ContractorEmployeeState = {
  contractorEmployees: getInitialPage<ContractorEmployee>(),
  singleContractorEmployee: null,
  contractorEmployeesMini: [],
  loadingGet: false
};

const slice = createSlice({
  name: 'contractorEmployees',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    getContractorEmployees(
      state: ContractorEmployeeState,
      action: PayloadAction<{ contractorEmployees: Page<ContractorEmployee> }>
    ) {
      const { contractorEmployees } = action.payload;
      state.contractorEmployees = contractorEmployees;
    },
    getSingleContractorEmployee(
      state: ContractorEmployeeState,
      action: PayloadAction<{ contractorEmployee: ContractorEmployee }>
    ) {
      const { contractorEmployee } = action.payload;
      state.singleContractorEmployee = contractorEmployee;
    },
    editContractorEmployee(state: ContractorEmployeeState, action: PayloadAction<{ contractorEmployee: ContractorEmployee }>) {
      const { contractorEmployee } = action.payload;
      const inContent = state.contractorEmployees.content.some(
        (contractorEmployee1) => contractorEmployee1.id === contractorEmployee.id
      );
      if (inContent) {
        state.contractorEmployees.content = state.contractorEmployees.content.map((contractorEmployee1) => {
          if (contractorEmployee1.id === contractorEmployee.id) {
            return contractorEmployee;
          }
          return contractorEmployee1;
        });
      } else {
        state.singleContractorEmployee = contractorEmployee;
      }
    },
    getContractorEmployeesMini(
      state: ContractorEmployeeState,
      action: PayloadAction<{ contractorEmployees: ContractorEmployeeMiniDTO[] }>
    ) {
      const { contractorEmployees } = action.payload;
      state.contractorEmployeesMini = contractorEmployees;
    },
    addContractorEmployee(state: ContractorEmployeeState, action: PayloadAction<{ contractorEmployee: ContractorEmployee }>) {
      const { contractorEmployee } = action.payload;
      state.contractorEmployees.content = [contractorEmployee, ...state.contractorEmployees.content];
    },
    deleteContractorEmployee(state: ContractorEmployeeState, action: PayloadAction<{ id: number }>) {
      const { id } = action.payload;
      const contractorEmployeeIndex = state.contractorEmployees.content.findIndex(
        (contractorEmployee) => contractorEmployee.id === id
      );
      state.contractorEmployees.content.splice(contractorEmployeeIndex, 1);
    },
    setLoadingGet(
      state: ContractorEmployeeState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingGet = loading;
    },
    clearSingleContractorEmployee(state: ContractorEmployeeState, action: PayloadAction<{}>) {
      state.singleContractorEmployee = null;
    }
  }
});

export const reducer = slice.reducer;

export const getContractorEmployees =
  (criteria: SearchCriteria): AppThunk =>
    async (dispatch) => {
      try {
        dispatch(slice.actions.setLoadingGet({ loading: true }));
        const contractorEmployees = await api.post<Page<ContractorEmployee>>(
          `${basePath}/search`,
          criteria
        );
        dispatch(slice.actions.getContractorEmployees({ contractorEmployees }));
      } finally {
        dispatch(slice.actions.setLoadingGet({ loading: false }));
      }
    };

export const getSingleContractorEmployee =
  (id: number): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const contractorEmployee = await api.get<ContractorEmployee>(`${basePath}/${id}`);
      dispatch(slice.actions.getSingleContractorEmployee({ contractorEmployee }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const editContractorEmployee =
  (id: number, contractorEmployee): AppThunk =>
    async (dispatch) => {
      const contractorEmployeeResponse = await api.patch<ContractorEmployee>(`${basePath}/${id}`, contractorEmployee);
      dispatch(slice.actions.editContractorEmployee({ contractorEmployee: contractorEmployeeResponse }));
    };

export const getContractorEmployeesMini = (): AppThunk => async (dispatch) => {
  const contractorEmployees = await api.get<ContractorEmployee[]>(`${basePath}/mini`);
  dispatch(slice.actions.getContractorEmployeesMini({ contractorEmployees }));
};

export const addContractorEmployee =
  (contractorEmployee): AppThunk =>
    async (dispatch) => {
      const contractorEmployeeResponse = await api.post<ContractorEmployee>(basePath, contractorEmployee);
      dispatch(slice.actions.addContractorEmployee({ contractorEmployee: contractorEmployeeResponse }));
    };

export const deleteContractorEmployee =
  (id: number): AppThunk =>
    async (dispatch) => {
      const contractorEmployeeResponse = await api.deletes<{ success: boolean }>(
        `${basePath}/${id}`
      );
      const { success } = contractorEmployeeResponse;
      if (success) {
        dispatch(slice.actions.deleteContractorEmployee({ id }));
      }
    };

export const getContractorEmployeesByVendor =
  (vendorId: number): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const contractorEmployees = await api.get<ContractorEmployee[]>(`${basePath}/vendor/${vendorId}`);
      const page: Page<ContractorEmployee> = {
        content: contractorEmployees,
        totalElements: contractorEmployees.length,
        totalPages: 1,
        last: true,
        size: contractorEmployees.length,
        number: 0,
        numberOfElements: contractorEmployees.length,
        first: true,
        empty: contractorEmployees.length === 0,
        sort: { empty: true, sorted: true, unsorted: false }
      };
      dispatch(slice.actions.getContractorEmployees({ contractorEmployees: page }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const getContractorEmployeeByEmail =
  (email: string): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const contractorEmployee = await api.get<ContractorEmployee>(`${basePath}/email/${email}`);
      dispatch(slice.actions.getSingleContractorEmployee({ contractorEmployee }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const clearSingleContractorEmployee = (): AppThunk => async (dispatch) => {
  dispatch(slice.actions.clearSingleContractorEmployee({}));
};

export default slice;