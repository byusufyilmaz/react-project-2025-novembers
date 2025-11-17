import type { ErrorBE } from '../utils/types';

interface ErrorInstance {
  response?: {
    data?: any;
  };
}

function handleServerErrors(err: ErrorInstance): ErrorBE {
  let errors: any = {};
  if (err.response?.data) {
    const { data } = err.response;
    if (typeof data !== 'string') {
      Object.keys(data).forEach((key) => {
        errors[key] = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
      });
    } else {
      errors = data;
    }
  }
  return errors;
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const helpers = {
  handleServerErrors,
  capitalize,
};

export default helpers;
