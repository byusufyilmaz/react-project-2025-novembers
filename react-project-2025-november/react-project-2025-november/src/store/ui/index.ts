import type { Action } from 'redux-actions';

import { handleActions } from 'redux-actions';

import types from './types';

export interface UiState {
  progressStatus: boolean;
  errorToastr: number;
}

const initialState: UiState = {
  progressStatus: false,
  errorToastr: 0,
};

const UiReducer = {
  [types.UPDATE_PROGRESS]: (
    state: UiState,
    { payload = true }: Action<typeof state.progressStatus>
  ) => ({
    ...state,
    progressStatus: payload,
  }),

  [types.ERROR_TOASTR]: (state: UiState, { payload }: Action<typeof state.errorToastr>) => ({
    ...state,
    errorToastr: payload,
  }),
};

export default handleActions(UiReducer as any, initialState) as any;
