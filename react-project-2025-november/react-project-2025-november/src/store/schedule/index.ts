/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Action } from 'redux-actions';

import { handleActions } from 'redux-actions';

import types from './types';

import type { ErrorBE } from '../../utils/types';
import type { ScheduleInstance } from '../../models/schedule';

export interface ScheduleState {
  errors: ErrorBE;
  loading: boolean;
  schedule: ScheduleInstance;
}

const initialState: ScheduleState = {
  loading: false,
  errors: {},
  schedule: {} as ScheduleInstance,
};

const scheduleReducer: any = {
  [types.FETCH_SCHEDULE_SUCCESS]: (
    state: ScheduleState,
    { payload }: Action<typeof state.schedule>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: {},
    schedule: payload,
  }),

  [types.FETCH_SCHEDULE_FAILED]: (
    state: ScheduleState,
    { payload }: Action<typeof state.errors>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: payload,
  }),

  [types.UPDATE_ASSIGNMENT_DATE]: (
    state: ScheduleState,
    {
      payload,
    }: Action<{
      assignmentId: string;
      shiftStart: string;
      shiftEnd: string;
    }>
  ): ScheduleState => {
    if (!payload) return state;

    const { assignmentId, shiftStart, shiftEnd } = payload;

    const updatedAssignments =
      state.schedule?.assignments?.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              shiftStart,
              shiftEnd,
              isUpdated: true,
            }
          : assignment
      ) ?? state.schedule?.assignments;

    return {
      ...state,
      schedule: {
        ...state.schedule,
        assignments: updatedAssignments ?? [],
      },
    };
  },
};

export default handleActions(scheduleReducer, initialState) as any;
