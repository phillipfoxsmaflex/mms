import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import { SafetyInstruction, SafetyInstructionMiniDTO } from '../models/owns/safetyInstruction';
import api from '../utils/api';
import { getInitialPage, Page, SearchCriteria } from '../models/owns/page';
import { revertAll } from 'src/utils/redux';

const basePath = 'safety-instructions';

interface SafetyInstructionState {
  safetyInstructions: Page<SafetyInstruction>;
  singleSafetyInstruction: SafetyInstruction;
  safetyInstructionsMini: SafetyInstructionMiniDTO[];
  loadingGet: boolean;
}

const initialState: SafetyInstructionState = {
  safetyInstructions: getInitialPage<SafetyInstruction>(),
  singleSafetyInstruction: null,
  safetyInstructionsMini: [],
  loadingGet: false
};

const slice = createSlice({
  name: 'safetyInstructions',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    getSafetyInstructions(
      state: SafetyInstructionState,
      action: PayloadAction<{ safetyInstructions: Page<SafetyInstruction> }>
    ) {
      const { safetyInstructions } = action.payload;
      state.safetyInstructions = safetyInstructions;
    },
    getSingleSafetyInstruction(
      state: SafetyInstructionState,
      action: PayloadAction<{ safetyInstruction: SafetyInstruction }>
    ) {
      const { safetyInstruction } = action.payload;
      state.singleSafetyInstruction = safetyInstruction;
    },
    editSafetyInstruction(state: SafetyInstructionState, action: PayloadAction<{ safetyInstruction: SafetyInstruction }>) {
      const { safetyInstruction } = action.payload;
      const inContent = state.safetyInstructions.content.some(
        (safetyInstruction1) => safetyInstruction1.id === safetyInstruction.id
      );
      if (inContent) {
        state.safetyInstructions.content = state.safetyInstructions.content.map((safetyInstruction1) => {
          if (safetyInstruction1.id === safetyInstruction.id) {
            return safetyInstruction;
          }
          return safetyInstruction1;
        });
      } else {
        state.singleSafetyInstruction = safetyInstruction;
      }
    },
    getSafetyInstructionsMini(
      state: SafetyInstructionState,
      action: PayloadAction<{ safetyInstructions: SafetyInstructionMiniDTO[] }>
    ) {
      const { safetyInstructions } = action.payload;
      state.safetyInstructionsMini = safetyInstructions;
    },
    addSafetyInstruction(state: SafetyInstructionState, action: PayloadAction<{ safetyInstruction: SafetyInstruction }>) {
      const { safetyInstruction } = action.payload;
      state.safetyInstructions.content = [safetyInstruction, ...state.safetyInstructions.content];
    },
    deleteSafetyInstruction(state: SafetyInstructionState, action: PayloadAction<{ id: number }>) {
      const { id } = action.payload;
      const safetyInstructionIndex = state.safetyInstructions.content.findIndex(
        (safetyInstruction) => safetyInstruction.id === id
      );
      state.safetyInstructions.content.splice(safetyInstructionIndex, 1);
    },
    setLoadingGet(
      state: SafetyInstructionState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingGet = loading;
    },
    clearSingleSafetyInstruction(state: SafetyInstructionState, action: PayloadAction<{}>) {
      state.singleSafetyInstruction = null;
    }
  }
});

export const reducer = slice.reducer;

export const getSafetyInstructions =
  (criteria: SearchCriteria): AppThunk =>
    async (dispatch) => {
      try {
        dispatch(slice.actions.setLoadingGet({ loading: true }));
        const safetyInstructions = await api.post<Page<SafetyInstruction>>(
          `${basePath}/search`,
          criteria
        );
        dispatch(slice.actions.getSafetyInstructions({ safetyInstructions }));
      } finally {
        dispatch(slice.actions.setLoadingGet({ loading: false }));
      }
    };

export const getSingleSafetyInstruction =
  (id: number): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const safetyInstruction = await api.get<SafetyInstruction>(`${basePath}/${id}`);
      dispatch(slice.actions.getSingleSafetyInstruction({ safetyInstruction }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const editSafetyInstruction =
  (id: number, safetyInstruction): AppThunk =>
    async (dispatch) => {
      const safetyInstructionResponse = await api.patch<SafetyInstruction>(`${basePath}/${id}`, safetyInstruction);
      dispatch(slice.actions.editSafetyInstruction({ safetyInstruction: safetyInstructionResponse }));
    };

export const getSafetyInstructionsMini = (): AppThunk => async (dispatch) => {
  const safetyInstructions = await api.get<SafetyInstruction[]>(`${basePath}/mini`);
  dispatch(slice.actions.getSafetyInstructionsMini({ safetyInstructions }));
};

export const addSafetyInstruction =
  (safetyInstruction): AppThunk =>
    async (dispatch) => {
      const safetyInstructionResponse = await api.post<SafetyInstruction>(basePath, safetyInstruction);
      dispatch(slice.actions.addSafetyInstruction({ safetyInstruction: safetyInstructionResponse }));
    };

export const deleteSafetyInstruction =
  (id: number): AppThunk =>
    async (dispatch) => {
      const safetyInstructionResponse = await api.deletes<{ success: boolean }>(
        `${basePath}/${id}`
      );
      const { success } = safetyInstructionResponse;
      if (success) {
        dispatch(slice.actions.deleteSafetyInstruction({ id }));
      }
    };

export const completeSafetyInstruction =
  (id: number, signatureData: string, signatureName: string): AppThunk =>
    async (dispatch) => {
      const safetyInstructionResponse = await api.patch<SafetyInstruction>(
        `${basePath}/${id}/complete?signatureData=${encodeURIComponent(signatureData)}&signatureName=${encodeURIComponent(signatureName)}`,
        {}
      );
      dispatch(slice.actions.editSafetyInstruction({ safetyInstruction: safetyInstructionResponse }));
    };

export const getSafetyInstructionsByVendor =
  (vendorId: number): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const safetyInstructions = await api.get<SafetyInstruction[]>(`${basePath}/vendor/${vendorId}`);
      const page: Page<SafetyInstruction> = {
        content: safetyInstructions,
        totalElements: safetyInstructions.length,
        totalPages: 1,
        last: true,
        size: safetyInstructions.length,
        number: 0,
        numberOfElements: safetyInstructions.length,
        first: true,
        empty: safetyInstructions.length === 0,
        sort: { empty: true, sorted: true, unsorted: false }
      };
      dispatch(slice.actions.getSafetyInstructions({ safetyInstructions: page }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const getSafetyInstructionsByEmployee =
  (employeeId: number): AppThunk =>
    async (dispatch) => {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const safetyInstructions = await api.get<SafetyInstruction[]>(`${basePath}/employee/${employeeId}`);
      const page: Page<SafetyInstruction> = {
        content: safetyInstructions,
        totalElements: safetyInstructions.length,
        totalPages: 1,
        last: true,
        size: safetyInstructions.length,
        number: 0,
        numberOfElements: safetyInstructions.length,
        first: true,
        empty: safetyInstructions.length === 0,
        sort: { empty: true, sorted: true, unsorted: false }
      };
      dispatch(slice.actions.getSafetyInstructions({ safetyInstructions: page }));
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    };

export const getExpiredSafetyInstructions = (): AppThunk => async (dispatch) => {
  dispatch(slice.actions.setLoadingGet({ loading: true }));
  const safetyInstructions = await api.get<SafetyInstruction[]>(`${basePath}/expired`);
  const page: Page<SafetyInstruction> = {
    content: safetyInstructions,
    totalElements: safetyInstructions.length,
    totalPages: 1,
    last: true,
    size: safetyInstructions.length,
    number: 0,
    numberOfElements: safetyInstructions.length,
    first: true,
    empty: safetyInstructions.length === 0,
    sort: { empty: true, sorted: true, unsorted: false }
  };
  dispatch(slice.actions.getSafetyInstructions({ safetyInstructions: page }));
  dispatch(slice.actions.setLoadingGet({ loading: false }));
};

export const checkEmployeeInstructionValid =
  (employeeId: number): AppThunk =>
    async () => {
      const response = await api.get<boolean>(`${basePath}/employee/${employeeId}/valid`);
      return response;
    };

export const clearSingleSafetyInstruction = (): AppThunk => async (dispatch) => {
  dispatch(slice.actions.clearSingleSafetyInstruction({}));
};

export default slice;