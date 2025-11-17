/* eslint-disable @typescript-eslint/no-explicit-any */
import { combineReducers } from 'redux';

import uiReducer from './ui';
import scheduleReducer from './schedule';
import authReducer from './auth';

import type { UiState } from './ui';
import type { AuthState } from './auth';
import type { ScheduleState } from './schedule';

interface RootStateInstance {
  ui: UiState;
  auth: AuthState;
  schedule: ScheduleState;
}

const appReducer: any = combineReducers<RootStateInstance>({
  ui: uiReducer,
  schedule: scheduleReducer,
  auth: authReducer,
});

const initialState = appReducer(
  {
    ui: undefined,
    auth: undefined,
    schedule: undefined,
  },
  {
    type: undefined,
  }
);

const rootReducer: typeof appReducer = (state: any, action: any) => {
  if (action.type === 'SIGNIN') {
    state = initialState;
  }
  return appReducer(state, action);
};

export { rootReducer };
export type { RootStateInstance };
