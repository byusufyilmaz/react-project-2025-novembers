import type { AllEffect, CallEffect, ForkEffect, RaceEffect, TakeEffect } from 'redux-saga/effects';

import { all } from 'redux-saga/effects';

import authSagas from './auth/saga';
import userSagas from './schedule/saga';

type Effect = AllEffect<
  | ForkEffect<never>
  | Generator<TakeEffect | RaceEffect<TakeEffect | CallEffect<void>>, void, unknown>
>;

export default function* rootSaga(): Generator<Effect, void, undefined> {
  yield all([
    ...authSagas,
    ...userSagas,
  ]);
}
