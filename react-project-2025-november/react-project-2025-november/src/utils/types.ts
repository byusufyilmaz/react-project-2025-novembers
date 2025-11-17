import type { AxiosResponse } from 'axios';
import type { PutEffect, CallEffect } from 'redux-saga/effects';

export interface Callbacks<R = any, E = any> {
  onSuccess?: (response?: R) => void;
  onError?: (err: E) => void;
  onLoadEnd?: () => void;
}

export type ErrorBE = Record<string, string>;
export type APIError = {
  detail: string;
  status_code: number;
};

export type SagaReturnType<T> = Generator<PutEffect | CallEffect<AxiosResponse<T>>>;

export type ResponseBE = any;

export type ID = string | number;
