import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import Permit, { PermitLocation } from '../models/owns/permit';
import api from '../utils/api';
import { getInitialPage, Page, SearchCriteria } from '../models/owns/page';
import { revertAll } from 'src/utils/redux';
import File from '../models/owns/file';

const basePath = 'permits';
const locationBasePath = 'permit-locations';

interface PermitState {
  permits: Page<Permit>;
  singlePermit: Permit;
  permitsByLocation: { [key: number]: Permit[] };
  locations: PermitLocation[];
  singleLocation: PermitLocation;
  loadingGet: boolean;
}

const initialState: PermitState = {
  permits: getInitialPage<Permit>(),
  singlePermit: null,
  permitsByLocation: {},
  locations: [],
  singleLocation: null,
  loadingGet: false
};

const slice = createSlice({
  name: 'permits',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    getPermits(
      state: PermitState,
      action: PayloadAction<{ permits: Page<Permit> }>
    ) {
      const { permits } = action.payload;
      state.permits = permits;
    },
    getSinglePermit(
      state: PermitState,
      action: PayloadAction<{ permit: Permit }>
    ) {
      const { permit } = action.payload;
      state.singlePermit = permit;
    },
    addPermit(state: PermitState, action: PayloadAction<{ permit: Permit }>) {
      const { permit } = action.payload;
      state.permits.content = [permit, ...state.permits.content];
    },
    editPermit(state: PermitState, action: PayloadAction<{ permit: Permit }>) {
      const { permit } = action.payload;
      const inContent = state.permits.content.some(
        (permit1) => permit1.id === permit.id
      );
      if (inContent) {
        state.permits.content = state.permits.content.map((permit1) => {
          if (permit1.id === permit.id) {
            return permit;
          }
          return permit1;
        });
      }
      if (state.singlePermit?.id === permit.id) state.singlePermit = permit;
    },
    addFilesToPermit(
      state: PermitState,
      action: PayloadAction<{ files: File[]; id: number }>
    ) {
      const { files, id } = action.payload;
      const inContent = state.permits.content.some(
        (permit1) => permit1.id === id
      );
      if (inContent) {
        state.permits.content = state.permits.content.map((permit1) => {
          if (permit1.id === id) {
            permit1.files.push(...files);
          }
          return permit1;
        });
      }
      if (state.singlePermit?.id === id) state.singlePermit.files.push(...files);
    },
    setFilesForPermit(
      state: PermitState,
      action: PayloadAction<{ files: File[]; id: number }>
    ) {
      const { files, id } = action.payload;
      const inContent = state.permits.content.some(
        (permit1) => permit1.id === id
      );
      if (inContent) {
        state.permits.content = state.permits.content.map((permit1) => {
          if (permit1.id === id) {
            permit1.files = files;
          }
          return permit1;
        });
      }
      if (state.singlePermit?.id === id) state.singlePermit.files = files;
    },
    deletePermit(state: PermitState, action: PayloadAction<{ id: number }>) {
      const { id } = action.payload;
      const permitIndex = state.permits.content.findIndex(
        (permit) => permit.id === id
      );
      if (permitIndex !== -1) state.permits.content.splice(permitIndex, 1);
    },
    clearSinglePermit(state: PermitState, action: PayloadAction<{}>) {
      state.singlePermit = null;
    },
    getPermitsByLocation(
      state: PermitState,
      action: PayloadAction<{ permits: Permit[]; id: number }>
    ) {
      const { permits, id } = action.payload;
      state.permitsByLocation[id] = permits;
    },
    setLoadingGet(
      state: PermitState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingGet = loading;
    },
    // Location reducers
    getLocations(
      state: PermitState,
      action: PayloadAction<{ locations: PermitLocation[] }>
    ) {
      const { locations } = action.payload;
      state.locations = locations;
    },
    getSingleLocation(
      state: PermitState,
      action: PayloadAction<{ location: PermitLocation }>
    ) {
      const { location } = action.payload;
      state.singleLocation = location;
    },
    addLocation(
      state: PermitState,
      action: PayloadAction<{ location: PermitLocation }>
    ) {
      const { location } = action.payload;
      state.locations = [location, ...state.locations];
    },
    editLocation(
      state: PermitState,
      action: PayloadAction<{ location: PermitLocation }>
    ) {
      const { location } = action.payload;
      state.locations = state.locations.map((loc) => {
        if (loc.id === location.id) {
          return location;
        }
        return loc;
      });
      if (state.singleLocation?.id === location.id)
        state.singleLocation = location;
    },
    deleteLocation(state: PermitState, action: PayloadAction<{ id: number }>) {
      const { id } = action.payload;
      const locationIndex = state.locations.findIndex((loc) => loc.id === id);
      if (locationIndex !== -1) state.locations.splice(locationIndex, 1);
    }
  }
});

export const reducer = slice.reducer;

// Permit actions
export const getPermits =
  (criteria: SearchCriteria): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const permits = await api.post<Page<Permit>>(
        `${basePath}/search`,
        criteria
      );
      dispatch(slice.actions.getPermits({ permits }));
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const getSinglePermit =
  (id: number): AppThunk =>
  async (dispatch) => {
    dispatch(slice.actions.setLoadingGet({ loading: true }));
    const permit = await api.get<Permit>(`${basePath}/${id}`);
    dispatch(slice.actions.getSinglePermit({ permit }));
    dispatch(slice.actions.setLoadingGet({ loading: false }));
  };

export const addPermit =
  (permit): AppThunk =>
  async (dispatch) => {
    const permitResponse = await api.post<Permit>(basePath, permit);
    dispatch(slice.actions.addPermit({ permit: permitResponse }));
  };

// Alias for addPermit
export const createPermit = addPermit;

export const editPermit =
  (id: number, permit): AppThunk =>
  async (dispatch) => {
    const permitResponse = await api.patch<Permit>(`${basePath}/${id}`, permit);
    dispatch(slice.actions.editPermit({ permit: permitResponse }));
  };

// Alias for editPermit
export const updatePermit = editPermit;

export const addFilesToPermit =
  (id: number, files: { id: number }[]): AppThunk =>
  async (dispatch) => {
    const response = await api.patch<File[]>(
      `${basePath}/files/${id}/add`,
      files
    );
    dispatch(slice.actions.addFilesToPermit({ files: response, id }));
  };

export const removeFileFromPermit =
  (permitId: number, fileId: number): AppThunk =>
  async (dispatch) => {
    const response = await api.deletes<File[]>(
      `${basePath}/files/${permitId}/${fileId}/remove`
    );
    dispatch(slice.actions.setFilesForPermit({ files: response, id: permitId }));
  };

export const submitPermitForApproval =
  (id: number): AppThunk =>
  async (dispatch) => {
    const permitResponse = await api.patch<Permit>(
      `${basePath}/${id}/submit`,
      {}
    );
    dispatch(slice.actions.editPermit({ permit: permitResponse }));
  };

export const approvePermit =
  (id: number): AppThunk =>
  async (dispatch) => {
    const permitResponse = await api.patch<Permit>(
      `${basePath}/${id}/approve`,
      {}
    );
    dispatch(slice.actions.editPermit({ permit: permitResponse }));
  };

export const rejectPermit =
  (id: number, reason: string): AppThunk =>
  async (dispatch) => {
    const permitResponse = await api.patch<Permit>(`${basePath}/${id}/reject`, {
      reason
    });
    dispatch(slice.actions.editPermit({ permit: permitResponse }));
  };

export const activatePermit =
  (id: number): AppThunk =>
  async (dispatch) => {
    const permitResponse = await api.patch<Permit>(
      `${basePath}/${id}/activate`,
      {}
    );
    dispatch(slice.actions.editPermit({ permit: permitResponse }));
  };

export const completePermit =
  (id: number): AppThunk =>
  async (dispatch) => {
    const permitResponse = await api.patch<Permit>(
      `${basePath}/${id}/complete`,
      {}
    );
    dispatch(slice.actions.editPermit({ permit: permitResponse }));
  };

export const cancelPermit =
  (id: number, reason: string): AppThunk =>
  async (dispatch) => {
    const permitResponse = await api.patch<Permit>(`${basePath}/${id}/cancel`, {
      reason
    });
    dispatch(slice.actions.editPermit({ permit: permitResponse }));
  };

export const deletePermit =
  (id: number): AppThunk =>
  async (dispatch) => {
    const permitResponse = await api.deletes<{ success: boolean }>(
      `${basePath}/${id}`
    );
    const { success } = permitResponse;
    if (success) {
      dispatch(slice.actions.deletePermit({ id }));
    }
  };

export const getPermitsByLocation =
  (id: number): AppThunk =>
  async (dispatch) => {
    const permits = await api.get<Permit[]>(`${basePath}/location/${id}`);
    dispatch(
      slice.actions.getPermitsByLocation({
        id,
        permits
      })
    );
  };

export const clearSinglePermit = (): AppThunk => async (dispatch) => {
  dispatch(slice.actions.clearSinglePermit({}));
};

// Location actions
export const getPermitLocations = (): AppThunk => async (dispatch) => {
  const locations = await api.get<PermitLocation[]>(locationBasePath);
  dispatch(slice.actions.getLocations({ locations }));
};

export const getSinglePermitLocation =
  (id: number): AppThunk =>
  async (dispatch) => {
    const location = await api.get<PermitLocation>(`${locationBasePath}/${id}`);
    dispatch(slice.actions.getSingleLocation({ location }));
  };

export const addPermitLocation =
  (location): AppThunk =>
  async (dispatch) => {
    const locationResponse = await api.post<PermitLocation>(
      locationBasePath,
      location
    );
    dispatch(slice.actions.addLocation({ location: locationResponse }));
  };

export const editPermitLocation =
  (id: number, location): AppThunk =>
  async (dispatch) => {
    const locationResponse = await api.patch<PermitLocation>(
      `${locationBasePath}/${id}`,
      location
    );
    dispatch(slice.actions.editLocation({ location: locationResponse }));
  };

export const deletePermitLocation =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.deletes<{ success: boolean }>(
      `${locationBasePath}/${id}`
    );
    const { success } = response;
    if (success) {
      dispatch(slice.actions.deleteLocation({ id }));
    }
  };

export default slice;
