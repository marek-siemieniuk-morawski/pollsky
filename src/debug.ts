const DEBUG = process.env.DEBUG === 'pollsky';

export const debug = (message?: unknown, ...optionalParams: unknown[]): void => {
  if (DEBUG) {
    console.debug(message, ...optionalParams);
  }
}
