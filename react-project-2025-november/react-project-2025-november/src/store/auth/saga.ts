/* eslint-disable @typescript-eslint/no-unused-expressions */
import type { Action } from "redux-actions";

import { put, debounce } from "redux-saga/effects";

import types from "../auth/types";
import Logger from "../../utils/logger";
import * as actions from "../auth/actions";
import { profileResponse } from "../../constants/api";
import AuthSession from "../../utils/session";
import { updateProgress } from "../ui/actions";
import type { Callbacks } from "../../utils/types";

const QUERY_DEBOUNCE = 1000;

function* asyncLogin({
  payload: { onSuccess, onError } = {},
}: Action<Callbacks>) {
  yield put(updateProgress());
  try {
    const response = profileResponse;
    yield put(actions.signinSuccess(response.data));

    AuthSession.setId(response.data.id);
    AuthSession.setName(response.data!.name);
    AuthSession.setEmail(response.data!.email);
    AuthSession.setPhoneNumber(response.data!.phoneNumber);
    AuthSession.setOrganizationId(response.data!.organizationId);
    AuthSession.setDepartmentId(response.data!.currentDepartmentId);
    AuthSession.setRoles(`${response.data!.role}`);
    AuthSession.setLanguage(response.data.language);

    onSuccess && onSuccess(response);
  } catch (err) {
    Logger.error(err);
    onError && onError(err);
    yield put(actions.signinFailed());
  } finally {
    yield put(updateProgress(false));
  }
}

const authSagas = [
  debounce(QUERY_DEBOUNCE, types.SIGNIN, asyncLogin),
];

export default authSagas;
