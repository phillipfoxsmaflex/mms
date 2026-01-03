import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import { ManagementOfChange } from '../models/owns/managementOfChange';
import api from '../utils/api';
import { revertAll } from 'src/utils/redux';

interface MocState {
  mocs: ManagementOfChange[];
  singleMoc: ManagementOfChange | null;
  loadingGet: boolean;
}

const initialState: MocState = {
  mocs: [],
  singleMoc: null,
  loadingGet: false
};

const slice = createSlice({
  name: 'managementOfChange',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    getMocs(
      state: MocState,
      action: PayloadAction<{ mocs: ManagementOfChange[] }>
    ) {
      const { mocs } = action.payload;
      state.mocs = mocs;
    },
    getSingleMoc(
      state: MocState,
      action: PayloadAction<{ moc: ManagementOfChange }>
    ) {
      const { moc } = action.payload;
      state.singleMoc = moc;
    },
    addMoc(
      state: MocState,
      action: PayloadAction<{ moc: ManagementOfChange }>
    ) {
      const { moc } = action.payload;
      state.mocs = [...state.mocs, moc];
    },
    editMoc(
      state: MocState,
      action: PayloadAction<{ moc: ManagementOfChange }>
    ) {
      const { moc } = action.payload;
      const mocIndex = state.mocs.findIndex(
        (m) => m.id === moc.id
      );
      if (mocIndex === -1) {
        state.mocs = [...state.mocs, moc];
      } else {
        state.mocs[mocIndex] = moc;
      }
      if (state.singleMoc?.id === moc.id) {
        state.singleMoc = moc;
      }
    },
    deleteMoc(
      state: MocState,
      action: PayloadAction<{ id: number }>
    ) {
      const { id } = action.payload;
      const mocIndex = state.mocs.findIndex(
        (moc) => moc.id === id
      );
      state.mocs.splice(mocIndex, 1);
    },
    clearSingleMoc(state: MocState) {
      state.singleMoc = null;
    },
    setLoadingGet(
      state: MocState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingGet = loading;
    }
  }
});

export const reducer = slice.reducer;

export const getMocs = (): AppThunk => async (dispatch) => {
  try {
    dispatch(slice.actions.setLoadingGet({ loading: true }));
    const mocs = await api.get<ManagementOfChange[]>('management-of-change');
    dispatch(slice.actions.getMocs({ mocs }));
  } finally {
    dispatch(slice.actions.setLoadingGet({ loading: false }));
  }
};

export const getMocsByPermit =
  (permitId: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const mocs = await api.get<ManagementOfChange[]>(`management-of-change/permit/${permitId}`);
      dispatch(slice.actions.getMocs({ mocs }));
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const getSingleMoc =
  (id: number): AppThunk =>
  async (dispatch) => {
    const moc = await api.get<ManagementOfChange>(`management-of-change/${id}`);
    dispatch(slice.actions.getSingleMoc({ moc }));
  };

export const addMoc =
  (moc): AppThunk =>
  async (dispatch) => {
    const mocResponse = await api.post<ManagementOfChange>('management-of-change', moc);
    dispatch(slice.actions.addMoc({ moc: mocResponse }));
  };

export const editMoc =
  (id: number, moc): AppThunk =>
  async (dispatch) => {
    const mocResponse = await api.patch<ManagementOfChange>(`management-of-change/${id}`, moc);
    dispatch(slice.actions.editMoc({ moc: mocResponse }));
  };

export const deleteMoc =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.deletes<{ success: boolean }>(`management-of-change/${id}`);
    const { success } = response;
    if (success) {
      dispatch(slice.actions.deleteMoc({ id }));
    }
  };

export const clearSingleMoc = (): AppThunk => async (dispatch) => {
  dispatch(slice.actions.clearSingleMoc());
};

// Workflow actions
export const approveMoc =
  (id: number): AppThunk =>
  async (dispatch) => {
    const moc = await api.patch<ManagementOfChange>(`management-of-change/${id}/approve`, {});
    dispatch(slice.actions.editMoc({ moc }));
  };

export const rejectMoc =
  (id: number, reason: string): AppThunk =>
  async (dispatch) => {
    const moc = await api.patch<ManagementOfChange>(`management-of-change/${id}/reject`, { rejectionReason: reason });
    dispatch(slice.actions.editMoc({ moc }));
  };

export default slice;
