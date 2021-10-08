import { ErrorDetails, ErrorProperties, Failure } from "./types";

/**
 * ✋ Base class for custom error types.
 */
export class PollskyError<T> extends Error {
  timestamp: string;

  result?: T;

  constructor(message: string, { timestamp, result }: ErrorProperties<T>) {
    super(message);

    this.timestamp = timestamp;
    this.result = result;

    Object.setPrototypeOf(this, PollskyError.prototype);
  }

  getDetails(): ErrorDetails<T> {
    return {
      message: this.message,
      timestamp: this.timestamp,
      result: this.result
    }
  }
}

export class ConditionFunctionError<T> extends PollskyError<T> {
  name = 'ConditionFunctionError';

  constructor(props: ErrorProperties<T>) {
    super('Condition is not met - function `conditionFn() returned `false` instead of `true`.', props);

    Object.setPrototypeOf(this, ConditionFunctionError.prototype);
  }
}

export class AtLeastConditionError<T> extends PollskyError<T> {
  name = 'AtLeastConditionError';

  constructor(props: ErrorProperties<T>) {
    super('Function `conditionFn()` returned `true` but atLeast timeout has not been called yet.', props);

    Object.setPrototypeOf(this, AtLeastConditionError.prototype);
  }
}

export class AtMostConditionError<T> extends PollskyError<T> {
  name = 'AtMostConditionError';

  constructor(props: ErrorProperties<T>) {
    super('Timeout has called before condition is met.', props);

    Object.setPrototypeOf(this, AtMostConditionError.prototype);
  }
}

export class ExceptionOccurredError<T> extends PollskyError<T> {
  name = 'ExceptionOccurredError';

  constructor(originalMessage: string, props: ErrorProperties<T>) {
    super(`During execution of asyncFn() an error was thrown. Details: ${originalMessage}`, props);

    Object.setPrototypeOf(this, ExceptionOccurredError.prototype);
  }
}

export class PollingFailedError<T> extends Error {
  failures: Failure<T>[];

  constructor(errors: Failure<T>[]) {
    super(`Polling failed after ${errors.length} retries. Details: ${JSON.stringify(errors, null, 2)}`);

    this.failures = errors;

    Object.setPrototypeOf(this, PollingFailedError.prototype);
  }
}