import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import {
  MocChangeRequest,
  MocAction,
  MocApproval
} from '../models/owns/moc';
import api from '../utils/api';
import { getInitialPage, Page, SearchCriteria } from '../models/owns/page';
import { revertAll } from 'src/utils/redux';

const basePath = 'moc-change-requests';
const actionBasePath = 'moc-actions';
const approvalBasePath = 'moc-approvals';

interface MocState {
  changeRequests: Page<MocChangeRequest>;
  singleChangeRequest: MocChangeRequest;
  changeRequestsByPermit: { [key: number]: MocChangeRequest[] };
  actions: MocAction[];
  actionsByChangeRequest: { [key: number]: MocAction[] };
  approvals: MocApproval[];
  approvalsByChangeRequest: { [key: number]: MocApproval[] };
  loadingGet: boolean;
}

const initialState: MocState = {
  changeRequests: getInitialPage<MocChangeRequest>(),
  singleChangeRequest: null,
  changeRequestsByPermit: {},
  actions: [],
  actionsByChangeRequest: {},
  approvals: [],
  approvalsByChangeRequest: {},
  loadingGet: false
};

const slice = createSlice({
  name: 'moc',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    getChangeRequests(
      state: MocState,
      action: PayloadAction<{ changeRequests: Page<MocChangeRequest> }>
    ) {
      const { changeRequests } = action.payload;
      state.changeRequests = changeRequests;
    },
    getSingleChangeRequest(
      state: MocState,
      action: PayloadAction<{ changeRequest: MocChangeRequest }>
    ) {
      const { changeRequest } = action.payload;
      state.singleChangeRequest = changeRequest;
    },
    addChangeRequest(
      state: MocState,
      action: PayloadAction<{ changeRequest: MocChangeRequest }>
    ) {
      const { changeRequest } = action.payload;
      state.changeRequests.content = [
        changeRequest,
        ...state.changeRequests.content
      ];
    },
    editChangeRequest(
      state: MocState,
      action: PayloadAction<{ changeRequest: MocChangeRequest }>
    ) {
      const { changeRequest } = action.payload;
      const inContent = state.changeRequests.content.some(
        (cr) => cr.id === changeRequest.id
      );
      if (inContent) {
        state.changeRequests.content = state.changeRequests.content.map((cr) => {
          if (cr.id === changeRequest.id) {
            return changeRequest;
          }
          return cr;
        });
      }
      if (state.singleChangeRequest?.id === changeRequest.id)
        state.singleChangeRequest = changeRequest;
    },
    deleteChangeRequest(state: MocState, action: PayloadAction<{ id: number }>) {
      const { id } = action.payload;
      const index = state.changeRequests.content.findIndex((cr) => cr.id === id);
      if (index !== -1) state.changeRequests.content.splice(index, 1);
    },
    clearSingleChangeRequest(state: MocState, action: PayloadAction<{}>) {
      state.singleChangeRequest = null;
    },
    getChangeRequestsByPermit(
      state: MocState,
      action: PayloadAction<{ changeRequests: MocChangeRequest[]; id: number }>
    ) {
      const { changeRequests, id } = action.payload;
      state.changeRequestsByPermit[id] = changeRequests;
    },
    setLoadingGet(
      state: MocState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingGet = loading;
    },
    // Action reducers
    getActions(
      state: MocState,
      action: PayloadAction<{ actions: MocAction[] }>
    ) {
      const { actions } = action.payload;
      state.actions = actions;
    },
    getActionsByChangeRequest(
      state: MocState,
      action: PayloadAction<{ actions: MocAction[]; id: number }>
    ) {
      const { actions, id } = action.payload;
      state.actionsByChangeRequest[id] = actions;
    },
    addAction(state: MocState, action: PayloadAction<{ action: MocAction }>) {
      const { action: mocAction } = action.payload;
      state.actions = [mocAction, ...state.actions];
      const crId = mocAction.mocChangeRequest?.id;
      if (crId && state.actionsByChangeRequest[crId]) {
        state.actionsByChangeRequest[crId] = [
          mocAction,
          ...state.actionsByChangeRequest[crId]
        ];
      }
    },
    editAction(state: MocState, action: PayloadAction<{ action: MocAction }>) {
      const { action: mocAction } = action.payload;
      state.actions = state.actions.map((a) => {
        if (a.id === mocAction.id) {
          return mocAction;
        }
        return a;
      });
      const crId = mocAction.mocChangeRequest?.id;
      if (crId && state.actionsByChangeRequest[crId]) {
        state.actionsByChangeRequest[crId] = state.actionsByChangeRequest[
          crId
        ].map((a) => {
          if (a.id === mocAction.id) {
            return mocAction;
          }
          return a;
        });
      }
    },
    deleteAction(state: MocState, action: PayloadAction<{ id: number }>) {
      const { id } = action.payload;
      state.actions = state.actions.filter((a) => a.id !== id);
      Object.keys(state.actionsByChangeRequest).forEach((key) => {
        state.actionsByChangeRequest[key] = state.actionsByChangeRequest[
          key
        ].filter((a) => a.id !== id);
      });
    },
    // Approval reducers
    getApprovals(
      state: MocState,
      action: PayloadAction<{ approvals: MocApproval[] }>
    ) {
      const { approvals } = action.payload;
      state.approvals = approvals;
    },
    getApprovalsByChangeRequest(
      state: MocState,
      action: PayloadAction<{ approvals: MocApproval[]; id: number }>
    ) {
      const { approvals, id } = action.payload;
      state.approvalsByChangeRequest[id] = approvals;
    },
    addApproval(
      state: MocState,
      action: PayloadAction<{ approval: MocApproval }>
    ) {
      const { approval } = action.payload;
      state.approvals = [approval, ...state.approvals];
      const crId = approval.mocChangeRequest?.id;
      if (crId && state.approvalsByChangeRequest[crId]) {
        state.approvalsByChangeRequest[crId] = [
          approval,
          ...state.approvalsByChangeRequest[crId]
        ];
      }
    },
    editApproval(
      state: MocState,
      action: PayloadAction<{ approval: MocApproval }>
    ) {
      const { approval } = action.payload;
      state.approvals = state.approvals.map((a) => {
        if (a.id === approval.id) {
          return approval;
        }
        return a;
      });
      const crId = approval.mocChangeRequest?.id;
      if (crId && state.approvalsByChangeRequest[crId]) {
        state.approvalsByChangeRequest[crId] = state.approvalsByChangeRequest[
          crId
        ].map((a) => {
          if (a.id === approval.id) {
            return approval;
          }
          return a;
        });
      }
    }
  }
});

export const reducer = slice.reducer;

// Change Request actions
export const getMocChangeRequests =
  (criteria: SearchCriteria): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const changeRequests = await api.post<Page<MocChangeRequest>>(
        `${basePath}/search`,
        criteria
      );
      dispatch(slice.actions.getChangeRequests({ changeRequests }));
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const getSingleMocChangeRequest =
  (id: number): AppThunk =>
  async (dispatch) => {
    dispatch(slice.actions.setLoadingGet({ loading: true }));
    const changeRequest = await api.get<MocChangeRequest>(`${basePath}/${id}`);
    dispatch(slice.actions.getSingleChangeRequest({ changeRequest }));
    dispatch(slice.actions.setLoadingGet({ loading: false }));
  };

export const addMocChangeRequest =
  (changeRequest): AppThunk =>
  async (dispatch) => {
    const response = await api.post<MocChangeRequest>(basePath, changeRequest);
    dispatch(slice.actions.addChangeRequest({ changeRequest: response }));
  };

export const editMocChangeRequest =
  (id: number, changeRequest): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocChangeRequest>(
      `${basePath}/${id}`,
      changeRequest
    );
    dispatch(slice.actions.editChangeRequest({ changeRequest: response }));
  };

export const submitMocForReview =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocChangeRequest>(
      `${basePath}/${id}/submit`,
      {}
    );
    dispatch(slice.actions.editChangeRequest({ changeRequest: response }));
  };

export const approveMocChangeRequest =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocChangeRequest>(
      `${basePath}/${id}/approve`,
      {}
    );
    dispatch(slice.actions.editChangeRequest({ changeRequest: response }));
  };

export const rejectMocChangeRequest =
  (id: number, reason: string): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocChangeRequest>(
      `${basePath}/${id}/reject`,
      { reason }
    );
    dispatch(slice.actions.editChangeRequest({ changeRequest: response }));
  };

export const startMocImplementation =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocChangeRequest>(
      `${basePath}/${id}/start-implementation`,
      {}
    );
    dispatch(slice.actions.editChangeRequest({ changeRequest: response }));
  };

export const completeMocImplementation =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocChangeRequest>(
      `${basePath}/${id}/complete-implementation`,
      {}
    );
    dispatch(slice.actions.editChangeRequest({ changeRequest: response }));
  };

export const closeMocChangeRequest =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocChangeRequest>(
      `${basePath}/${id}/close`,
      {}
    );
    dispatch(slice.actions.editChangeRequest({ changeRequest: response }));
  };

export const deleteMocChangeRequest =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.deletes<{ success: boolean }>(
      `${basePath}/${id}`
    );
    const { success } = response;
    if (success) {
      dispatch(slice.actions.deleteChangeRequest({ id }));
    }
  };

export const getMocChangeRequestsByPermit =
  (permitId: number): AppThunk =>
  async (dispatch) => {
    const changeRequests = await api.get<MocChangeRequest[]>(
      `${basePath}/permit/${permitId}`
    );
    dispatch(
      slice.actions.getChangeRequestsByPermit({
        id: permitId,
        changeRequests
      })
    );
  };

export const clearSingleMocChangeRequest = (): AppThunk => async (dispatch) => {
  dispatch(slice.actions.clearSingleChangeRequest({}));
};

// Action actions
export const getMocActionsByChangeRequest =
  (changeRequestId: number): AppThunk =>
  async (dispatch) => {
    const actions = await api.get<MocAction[]>(
      `${actionBasePath}/change-request/${changeRequestId}`
    );
    dispatch(
      slice.actions.getActionsByChangeRequest({
        id: changeRequestId,
        actions
      })
    );
  };

export const addMocAction =
  (action): AppThunk =>
  async (dispatch) => {
    const response = await api.post<MocAction>(actionBasePath, action);
    dispatch(slice.actions.addAction({ action: response }));
  };

export const editMocAction =
  (id: number, action): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocAction>(
      `${actionBasePath}/${id}`,
      action
    );
    dispatch(slice.actions.editAction({ action: response }));
  };

export const completeMocAction =
  (id: number, completionNotes: string): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocAction>(
      `${actionBasePath}/${id}/complete`,
      { completionNotes }
    );
    dispatch(slice.actions.editAction({ action: response }));
  };

export const deleteMocAction =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.deletes<{ success: boolean }>(
      `${actionBasePath}/${id}`
    );
    const { success } = response;
    if (success) {
      dispatch(slice.actions.deleteAction({ id }));
    }
  };

// Approval actions
export const getMocApprovalsByChangeRequest =
  (changeRequestId: number): AppThunk =>
  async (dispatch) => {
    const approvals = await api.get<MocApproval[]>(
      `${approvalBasePath}/change-request/${changeRequestId}`
    );
    dispatch(
      slice.actions.getApprovalsByChangeRequest({
        id: changeRequestId,
        approvals
      })
    );
  };

export const addMocApproval =
  (approval): AppThunk =>
  async (dispatch) => {
    const response = await api.post<MocApproval>(approvalBasePath, approval);
    dispatch(slice.actions.addApproval({ approval: response }));
  };

export const approveMocApproval =
  (id: number, comments: string): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocApproval>(
      `${approvalBasePath}/${id}/approve`,
      { comments }
    );
    dispatch(slice.actions.editApproval({ approval: response }));
  };

export const rejectMocApproval =
  (id: number, reason: string): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<MocApproval>(
      `${approvalBasePath}/${id}/reject`,
      { reason }
    );
    dispatch(slice.actions.editApproval({ approval: response }));
  };

export default slice;
