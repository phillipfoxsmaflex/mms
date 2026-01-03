import type { TypedUseSelectorHook } from 'react-redux';
import {
  useDispatch as useReduxDispatch,
  useSelector as useReduxSelector
} from 'react-redux';
import type { ThunkAction } from 'redux-thunk';
import type { Action } from '@reduxjs/toolkit';
import { configureStore, createAction } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { ImportResponse } from '../models/owns/imports';

const store = configureStore({
  reducer: rootReducer,
  devTools: true
});

export type RootState = ReturnType<typeof store.getState>;

export type StoreReturnType =
  | void
  | number
  | number[]
  | string
  | ImportResponse;
export type AppThunk = ThunkAction<
  Promise<StoreReturnType>,
  RootState,
  null,
  Action<string>
>;

export type AppDispatch = typeof store.dispatch;

export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

export const useDispatch = () => useReduxDispatch<AppDispatch>();

export default store;
