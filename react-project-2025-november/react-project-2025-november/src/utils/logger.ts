/* eslint-disable @typescript-eslint/no-unused-expressions */

const isNotProductionEnvironment = true;

const Logger = {
  log(...args: unknown[]): void {
    isNotProductionEnvironment && console.log(...args);
  },
  info(...args: unknown[]): void {
    isNotProductionEnvironment && console.info(...args);
  },
  warn(...args: unknown[]): void {
    isNotProductionEnvironment && console.warn(...args);
  },
  error(...args: unknown[]): void {
    isNotProductionEnvironment && console.error(...args);
  },
};

export default Logger;
