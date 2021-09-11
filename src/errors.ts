export class ConditionFunctionError extends Error {
  constructor() {
    super('Condition is not met - function `conditionFn() returned `false` instead of `true`.');

    Object.setPrototypeOf(this, ConditionFunctionError.prototype);
  }
}

export class AtLeastConditionError extends Error {
  constructor() {
    super('Function `conditionFn()` returned `true` but atLeast timeout has not beeen called yet.');

    Object.setPrototypeOf(this, AtLeastConditionError.prototype);
  }
}

export class AtMostConditionError extends Error {
  constructor() {
    super('Timeout has called before condition is met.');

    Object.setPrototypeOf(this, AtMostConditionError.prototype);
  }
}

export class ExceptionOccurredError extends Error {
  constructor(originalMessage: string) {
    super(`During execution of asyncFn() an error was thrown. Details: ${originalMessage}`);

    Object.setPrototypeOf(this, ExceptionOccurredError.prototype);
  }
}
