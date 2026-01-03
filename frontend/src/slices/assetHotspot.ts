import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import {
  AssetHotspot,
  CreateAssetHotspotRequest,
  UpdateAssetHotspotRequest
} from '../models/owns/assetHotspot';
import api from '../utils/api';
import { revertAll } from 'src/utils/redux';

interface AssetHotspotState {
  hotspotsByLocationImage: Record<number, AssetHotspot[]>;
  hotspotsByAsset: Record<number, AssetHotspot[]>;
  selectedHotspot: AssetHotspot | null;
  loadingGet: boolean;
}

const initialState: AssetHotspotState = {
  hotspotsByLocationImage: {},
  hotspotsByAsset: {},
  selectedHotspot: null,
  loadingGet: false
};

const slice = createSlice({
  name: 'assetHotspots',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    getHotspotsByLocationImage(
      state: AssetHotspotState,
      action: PayloadAction<{ locationImageId: number; hotspots: AssetHotspot[] }>
    ) {
      const { locationImageId, hotspots } = action.payload;
      state.hotspotsByLocationImage[locationImageId] = hotspots;
    },
    getHotspotsByAsset(
      state: AssetHotspotState,
      action: PayloadAction<{ assetId: number; hotspots: AssetHotspot[] }>
    ) {
      const { assetId, hotspots } = action.payload;
      state.hotspotsByAsset[assetId] = hotspots;
    },
    addHotspot(
      state: AssetHotspotState,
      action: PayloadAction<{ hotspot: AssetHotspot }>
    ) {
      const { hotspot } = action.payload;
      
      // Add to locationImage index
      if (!state.hotspotsByLocationImage[hotspot.locationImageId]) {
        state.hotspotsByLocationImage[hotspot.locationImageId] = [];
      }
      state.hotspotsByLocationImage[hotspot.locationImageId] = [
        ...state.hotspotsByLocationImage[hotspot.locationImageId],
        hotspot
      ];
      
      // Add to asset index
      if (!state.hotspotsByAsset[hotspot.assetId]) {
        state.hotspotsByAsset[hotspot.assetId] = [];
      }
      state.hotspotsByAsset[hotspot.assetId] = [
        ...state.hotspotsByAsset[hotspot.assetId],
        hotspot
      ];
    },
    editHotspot(
      state: AssetHotspotState,
      action: PayloadAction<{ hotspot: AssetHotspot }>
    ) {
      const { hotspot } = action.payload;
      
      // Update in locationImage index
      if (state.hotspotsByLocationImage[hotspot.locationImageId]) {
        const locationImageIndex = state.hotspotsByLocationImage[
          hotspot.locationImageId
        ].findIndex((h) => h.id === hotspot.id);
        if (locationImageIndex !== -1) {
          state.hotspotsByLocationImage[hotspot.locationImageId][locationImageIndex] = hotspot;
        }
      }
      
      // Update in asset index
      if (state.hotspotsByAsset[hotspot.assetId]) {
        const assetIndex = state.hotspotsByAsset[hotspot.assetId].findIndex(
          (h) => h.id === hotspot.id
        );
        if (assetIndex !== -1) {
          state.hotspotsByAsset[hotspot.assetId][assetIndex] = hotspot;
        }
      }
    },
    deleteHotspot(
      state: AssetHotspotState,
      action: PayloadAction<{ id: number; locationImageId: number; assetId: number }>
    ) {
      const { id, locationImageId, assetId } = action.payload;
      
      // Remove from locationImage index
      if (state.hotspotsByLocationImage[locationImageId]) {
        const locationImageIndex = state.hotspotsByLocationImage[locationImageId].findIndex(
          (hotspot) => hotspot.id === id
        );
        if (locationImageIndex !== -1) {
          state.hotspotsByLocationImage[locationImageId].splice(locationImageIndex, 1);
        }
      }
      
      // Remove from asset index
      if (state.hotspotsByAsset[assetId]) {
        const assetIndex = state.hotspotsByAsset[assetId].findIndex(
          (hotspot) => hotspot.id === id
        );
        if (assetIndex !== -1) {
          state.hotspotsByAsset[assetId].splice(assetIndex, 1);
        }
      }
    },
    setSelectedHotspot(
      state: AssetHotspotState,
      action: PayloadAction<{ hotspot: AssetHotspot | null }>
    ) {
      const { hotspot } = action.payload;
      state.selectedHotspot = hotspot;
    },
    setLoadingGet(
      state: AssetHotspotState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingGet = loading;
    }
  }
});

export const reducer = slice.reducer;

export const getHotspotsByLocationImage =
  (locationImageId: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const hotspots = await api.get<AssetHotspot[]>(`/asset-hotspots/location-image/${locationImageId}`);
      dispatch(slice.actions.getHotspotsByLocationImage({ locationImageId, hotspots }));
    } catch (error) {
      console.error('Error fetching hotspots:', error);
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const getHotspotsByAsset =
  (assetId: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const hotspots = await api.get<AssetHotspot[]>(`/asset-hotspots/asset/${assetId}`);
      dispatch(slice.actions.getHotspotsByAsset({ assetId, hotspots }));
    } catch (error) {
      console.error('Error fetching hotspots:', error);
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const getHotspotById =
  (id: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const hotspot = await api.get<AssetHotspot>(`/asset-hotspots/${id}`);
      dispatch(slice.actions.setSelectedHotspot({ hotspot }));
    } catch (error) {
      console.error('Error fetching hotspot:', error);
      throw error;
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const createHotspot =
  (data: CreateAssetHotspotRequest): AppThunk =>
  async (dispatch) => {
    try {
      const hotspot = await api.post<AssetHotspot>('/asset-hotspots', data);
      dispatch(slice.actions.addHotspot({ hotspot }));
    } catch (error) {
      console.error('Error creating hotspot:', error);
      throw error;
    }
  };

export const updateHotspot =
  (id: number, data: UpdateAssetHotspotRequest): AppThunk =>
  async (dispatch) => {
    try {
      const hotspot = await api.patch<AssetHotspot>(`/asset-hotspots/${id}`, data);
      dispatch(slice.actions.editHotspot({ hotspot }));
    } catch (error) {
      console.error('Error updating hotspot:', error);
      throw error;
    }
  };

export const deleteHotspot =
  (id: number, locationImageId: number, assetId: number): AppThunk =>
  async (dispatch) => {
    try {
      await api.deletes(`/asset-hotspots/${id}`);
      dispatch(slice.actions.deleteHotspot({ id, locationImageId, assetId }));
    } catch (error) {
      console.error('Error deleting hotspot:', error);
      throw error;
    }
  };

export default slice;
