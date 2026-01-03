import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import LocationImage, { CreateLocationImageRequest } from '../models/owns/locationImage';
import api from '../utils/api';
import { revertAll } from 'src/utils/redux';

interface LocationImageState {
  locationImages: LocationImage[];
  locationImagesByLocation: Record<number, LocationImage[]>;
  selectedLocationImage: LocationImage | null;
  loadingGet: boolean;
  loadingCreate: boolean;
  loadingDelete: boolean;
}

const initialState: LocationImageState = {
  locationImages: [],
  locationImagesByLocation: {},
  selectedLocationImage: null,
  loadingGet: false,
  loadingCreate: false,
  loadingDelete: false
};

const slice = createSlice({
  name: 'locationImages',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    getLocationImages(
      state: LocationImageState,
      action: PayloadAction<{ locationId: number; images: LocationImage[] }>
    ) {
      const { locationId, images } = action.payload;
      state.locationImagesByLocation[locationId] = images;
    },
    addLocationImage(
      state: LocationImageState,
      action: PayloadAction<{ image: LocationImage }>
    ) {
      const { image } = action.payload;
      state.locationImages = [...state.locationImages, image];
      
      if (!state.locationImagesByLocation[image.locationId]) {
        state.locationImagesByLocation[image.locationId] = [];
      }
      state.locationImagesByLocation[image.locationId] = [
        ...state.locationImagesByLocation[image.locationId],
        image
      ];
    },
    editLocationImage(
      state: LocationImageState,
      action: PayloadAction<{ image: LocationImage }>
    ) {
      const { image } = action.payload;
      
      const imageIndex = state.locationImages.findIndex((img) => img.id === image.id);
      if (imageIndex !== -1) {
        state.locationImages[imageIndex] = image;
      }
      
      if (state.locationImagesByLocation[image.locationId]) {
        const locationImageIndex = state.locationImagesByLocation[image.locationId].findIndex(
          (img) => img.id === image.id
        );
        if (locationImageIndex !== -1) {
          state.locationImagesByLocation[image.locationId][locationImageIndex] = image;
        }
      }
    },
    deleteLocationImage(
      state: LocationImageState,
      action: PayloadAction<{ id: number; locationId: number }>
    ) {
      const { id, locationId } = action.payload;
      
      const imageIndex = state.locationImages.findIndex((image) => image.id === id);
      if (imageIndex !== -1) {
        state.locationImages.splice(imageIndex, 1);
      }
      
      if (state.locationImagesByLocation[locationId]) {
        const locationImageIndex = state.locationImagesByLocation[locationId].findIndex(
          (image) => image.id === id
        );
        if (locationImageIndex !== -1) {
          state.locationImagesByLocation[locationId].splice(locationImageIndex, 1);
        }
      }
    },
    setSelectedLocationImage(
      state: LocationImageState,
      action: PayloadAction<{ image: LocationImage | null }>
    ) {
      const { image } = action.payload;
      state.selectedLocationImage = image;
    },
    setLoadingGet(
      state: LocationImageState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingGet = loading;
    },
    setLoadingCreate(
      state: LocationImageState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingCreate = loading;
    },
    setLoadingDelete(
      state: LocationImageState,
      action: PayloadAction<{ loading: boolean }>
    ) {
      const { loading } = action.payload;
      state.loadingDelete = loading;
    }
  }
});

export const reducer = slice.reducer;

export const getLocationImagesByLocation =
  (locationId: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const images = await api.get<LocationImage[]>(`/location-images/location/${locationId}`);
      dispatch(slice.actions.getLocationImages({ locationId, images }));
    } catch (error) {
      console.error('Error fetching location images:', error);
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const getLocationImageById =
  (id: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingGet({ loading: true }));
      const image = await api.get<LocationImage>(`/location-images/${id}`);
      dispatch(slice.actions.setSelectedLocationImage({ image }));
    } catch (error) {
      console.error('Error fetching location image:', error);
      throw error;
    } finally {
      dispatch(slice.actions.setLoadingGet({ loading: false }));
    }
  };

export const createLocationImage =
  (data: CreateLocationImageRequest, fileId: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingCreate({ loading: true }));
      const image = await api.post<LocationImage>(`/location-images?fileId=${fileId}`, data);
      dispatch(slice.actions.addLocationImage({ image }));
    } catch (error) {
      console.error('Error creating location image:', error);
      throw error;
    } finally {
      dispatch(slice.actions.setLoadingCreate({ loading: false }));
    }
  };

export const deleteLocationImage =
  (id: number, locationId: number): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(slice.actions.setLoadingDelete({ loading: true }));
      await api.deletes(`/location-images/${id}`);
      dispatch(slice.actions.deleteLocationImage({ id, locationId }));
    } catch (error) {
      console.error('Error deleting location image:', error);
      throw error;
    } finally {
      dispatch(slice.actions.setLoadingDelete({ loading: false }));
    }
  };

export default slice;
