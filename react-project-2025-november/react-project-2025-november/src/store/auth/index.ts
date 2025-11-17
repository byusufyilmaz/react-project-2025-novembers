/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Action } from 'redux-actions';

import { handleActions } from 'redux-actions';

import types from '../auth/types';

import type { ErrorBE } from '../../utils/types';
import type { UserInstance } from '../../models/user';

export interface AuthState {
  errors: ErrorBE;
  loading: boolean;
  auth: UserInstance;
}

const initialState: AuthState = {
  loading: false,
  errors: {},
  auth: {} as UserInstance,
};

const authReducer: any = {
  [types.SIGNIN_SUCCESS]: (
    state: AuthState,
    { payload }: Action<typeof state.auth>
  ): AuthState => ({
    ...state,
    loading: false,
    errors: {},
    auth: payload,
  }),

  [types.SIGNIN_FAILED]: (
    state: AuthState,
    { payload }: Action<typeof state.errors>
  ): AuthState => ({
    ...state,
    loading: false,
    errors: payload,
  }),
};

export default handleActions(authReducer, initialState) as any;
