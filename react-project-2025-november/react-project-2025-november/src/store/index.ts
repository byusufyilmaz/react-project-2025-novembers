/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Task } from "redux-saga";
import type { Store, Reducer } from "redux";

import createSagaMiddleware from "redux-saga";
import { createBrowserHistory } from "history";
import { createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";
import { createReduxHistoryContext } from "redux-first-history";

import rootSaga from "./rootSaga";
import { rootReducer } from "./reducer";

import type { RootStateInstance } from "./reducer";

const bindMiddleware = (middleware: any[]) => {
  return composeWithDevTools(applyMiddleware(...middleware));
};

interface StoreInstance extends Store {
  sagaTask: Task;
}

const history = createBrowserHistory();

const { createReduxHistory, routerMiddleware } = createReduxHistoryContext({
  history,
  reduxTravelling: false,
  savePreviousLocations: 1,
});

const makeConfiguredStore = (
  reducer: Reducer<RootStateInstance>,
  initialState = {} as any
): StoreInstance => {
  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(
    reducer,
    initialState,
    bindMiddleware([sagaMiddleware, routerMiddleware])
  ) as StoreInstance;

  store.sagaTask = sagaMiddleware.run(rootSaga);

  return store;
};

const makeStore = (initialState = {}) =>
  makeConfiguredStore(rootReducer, initialState);

const store = makeConfiguredStore(rootReducer, {});
export const historyInstance = createReduxHistory(store);

export type AppDispatch = typeof store.dispatch;
export default makeStore;
