import { Failure } from "./types";

/**
 * Properties of `PollskyError` class constructor
 */
export interface PollskyErrorAttributes<T> {
	timestamp: string;
	result?: T;
}

/**
 * ✋ Base class for custom error types.
 */
export class PollskyError<T> extends Error {
  timestamp: string;

  result?: T;

  constructor(message: string, { timestamp, result }: PollskyErrorAttributes<T>) {
    super(message);

    this.timestamp = timestamp;
    this.result = result;

    Object.setPrototypeOf(this, PollskyError.prototype);
  }
}

export class ConditionFunctionError<T> extends PollskyError<T> {
  name = 'ConditionFunctionError';

  constructor(props: PollskyErrorAttributes<T>) {
    super('Condition is not met - function `conditionFn() returned `false` instead of `true`.', props);

    Object.setPrototypeOf(this, ConditionFunctionError.prototype);
  }
}

export class AtLeastConditionError<T> extends PollskyError<T> {
  name = 'AtLeastConditionError';

  constructor(props: PollskyErrorAttributes<T>) {
    super('Function `conditionFn()` returned `true` but atLeast timeout has not been called yet.', props);

    Object.setPrototypeOf(this, AtLeastConditionError.prototype);
  }
}

export class AtMostConditionError<T> extends PollskyError<T> {
  name = 'AtMostConditionError';

  constructor(props: PollskyErrorAttributes<T>) {
    super('Timeout has called before condition is met.', props);

    Object.setPrototypeOf(this, AtMostConditionError.prototype);
  }
}

export class ExceptionOccurredError<T> extends PollskyError<T> {
  name = 'ExceptionOccurredError';

  constructor(errorMsg: string, props: PollskyErrorAttributes<T>) {
    super(`During execution of asyncFn() an error was thrown. Message: ${errorMsg}`, props);

    Object.setPrototypeOf(this, ExceptionOccurredError.prototype);
  }
}

export class PollingFailedError<T> extends Error {
  failures: Failure<T>[];

  constructor(failures: Failure<T>[]) {
    super(`Polling failed after ${failures.length} retries. Details: ${JSON.stringify(failures, null, 2)}`);

    this.failures = failures;

    Object.setPrototypeOf(this, PollingFailedError.prototype);
  }
}