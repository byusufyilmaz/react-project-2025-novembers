import { createAction } from 'redux-actions';

import types from './types';

export const setProfile = createAction(types.SIGNIN);
export const signinSuccess = createAction(types.SIGNIN_SUCCESS);
export const signinFailed = createAction(types.SIGNIN_FAILED);;