import { AtLeastConditionError, AtMostConditionError, ConditionFunctionError, ExceptionOccurredError, PollingFailedError, PollskyError } from "./errors";

import { getTimestamp, Time } from "./utils";
import { Failure, TimeUnit } from "./types";
import { debug } from "./debug";

/**
 * ⛓ Chained Polling Library for Node.js
 * @public
 */
class Pollsky<T> {
	/**
	 * Asynchronous function to be polled until `conditionFn()` has returned `true` value
	 * or, if defined, until the master timeout has been called.
	 */
	private asyncFn: () => Promise<T>;

	/**
	 * The number of times the `asyncFn()` has invoked before `conditionFn()`
	 * returns true.
	 */
	private retries = 0;

	/**
	 * 
	 */
	private failures: Failure<T>[] = [];

	/**
	 * Time between the end of last retry and the next one.
	 * @default { value: 1000, unit: 'milliseconds' }
	 */
	private pollingInterval = new Time({
		interval: 1000,
		unit: 'milliseconds'
	});

	/**
	 * How long `asyncFn()` is invoked until the master timeout has been called.
	 */
	private atMostDuration?: Time;

	/**
	 * Timeout object of master timeout.
	 */
	private atMostTimeout?: NodeJS.Timeout;

	/**
	 * 
	 */
	private atMostTimeoutToBeCalled?: boolean;

	/**
	 * Duration of "at least condition" that makes polling continue even if
	 * the `conditionFn` is already met.
	 */
	private atLeastDuration?: Time;

	/**
	 * Timeout object of at least condition.
	 */
	private atLeastTimeout?: NodeJS.Timeout;

	/**
	 * Instructs Pollsky to ignore errors thrown by `asyncFn`.
	 */
	private isIgnoreErrors = false;

	/**
	 * Instructs Pollsky to return a value even if master timeout is called.
	 */
	private isDontThrowError = false;

	/** 
	 * Static method created only to be exported, and thus achieve "cleaner" API. 
	 */
	static wait<T>(asyncFn: () => Promise<T>): Pollsky<T> {
		return new Pollsky(asyncFn);
	}

	private constructor(asyncFn: () => Promise<T>) {
		this.asyncFn = asyncFn;
	}

	/**
	 * Starts polling.
	 */
	async until(conditionFn: (value: T) => boolean): Promise<T> {
		debug(`Polling started. Parameters:`, { 
			isIgnoreErrors: this.isIgnoreErrors, 
			interval: this.pollingInterval,
			atLeastCondition: this.atLeastDuration,
			atMostDuration: this.atMostDuration
		});

		const result = await this.poll(this.asyncFn, conditionFn, this.retries);

		if (this.atMostTimeout) {
			clearTimeout(this.atMostTimeout);
		}

		return result;
	}

	/** 
	 * Stops polling with failure when timeout is called. 
	 */
	atMost(interval: number, unit: TimeUnit): Pollsky<T> {
		this.atMostDuration = new Time({ interval, unit });

		this.atMostTimeout = setTimeout(() => {
			this.atMostTimeoutToBeCalled = true;
		}, this.atMostDuration.toMilliseconds());

		return this;
	}

	/** 
	 * Makes polling wait at least a certain amount of time until the result is returned. 
	 */
	atLeast(interval: number, unit: TimeUnit): Pollsky<T> {
		this.atMostDuration = new Time({ interval, unit });

		this.atLeastTimeout = setTimeout(() => {
			this.atLeastTimeout = undefined;
		}, this.atMostDuration.toMilliseconds());

		return this;
	}

	/** 
	 * Changes the default interval duration. 
	 */
	withInterval(interval: number, unit: TimeUnit): Pollsky<T> {
		this.pollingInterval = new Time({ interval, unit });

		return this;
	}

	/** 
	 * Causes errors thrown by `asyncFn` being ignored. 
	 */
	dontThrowError(): Pollsky<T> {
		this.isDontThrowError = true;

		return this;
	}

	/** 
	 * Causes errors thrown by `asyncFn` being ignored. 
	 */
	ignoreErrors(): Pollsky<T> {
		this.isIgnoreErrors = true;

		return this;
	}

	/**
	 * The core method in this project, it basically contains the entire logic 
	 * required for polling. Execute the given `asyncFn` function, checks if 
	 * all of the conditions are met and handles the errors if needed be.
	 */
	private async poll(asyncFn: () => Promise<T>, conditionFn: (value: T) => boolean, retries: number): Promise<T> {
		try {
			return this.checkConditions(await this.executeAsyncFn(this.asyncFn), conditionFn);
		} catch (error) {
			if (error instanceof PollskyError) {
				this.failures.push({
					error: error.name,
					errorMsg: error.message,
					result: error.result,
					timestamp: new Date().toISOString()
				});

				if (error instanceof AtMostConditionError) {
					throw new PollingFailedError(this.failures);
				}
	
				if (error instanceof ExceptionOccurredError) {
					if (!this.isIgnoreErrors) {
						throw new PollingFailedError(this.failures);
					}
				}

				await this.wait(this.pollingInterval.toMilliseconds());

				return this.poll(asyncFn, conditionFn, retries + 1);
			}

			throw error;
		}
	}

	/**
	 * Performs a single execution of `asyncFn` and wraps it with `try catch`
	 * in order to throw custom error and handle it properly.
	 */
	private async executeAsyncFn<T>(asyncFn: () => Promise<T>): Promise<T> {
		this.retries++;

		try {
			debug(`Executing asyncFn()... Retry: ${this.retries}`);
			
			return await asyncFn();
		} catch (error) {
			throw new ExceptionOccurredError<T>(error.message, { timestamp: getTimestamp() });
		}
	}

	/** 
	 * Checks if all conditions are met and if not, throws a custom error. 
	 */
	private checkConditions<T>(result: T, conditionFn: (value: T) => boolean): T {		
		if (this.atMostTimeoutToBeCalled) {
			if (this.isDontThrowError) {
				debug('Master timeout called but the flag returnValueIfFailed is set');
				debug('Returning the last result.');
	
				return result;
			}

			throw new AtMostConditionError({ timestamp: getTimestamp(), result: result });
		}

		if (conditionFn(result) === false) {
			throw new ConditionFunctionError({ timestamp: getTimestamp(), result: result });
		}

		if (this.atLeastTimeout) {
			throw new AtLeastConditionError({ timestamp: getTimestamp(), result: result });
		}

		debug('Polling finished with success - conditionFn() returned `true`.');
		debug('Returning the last result.');

		return result;
	}

	/** 
	 * Waits certain amout of time. 
	 */
	private wait(duration: number): Promise<unknown> {
		return new Promise(resolve => setTimeout(resolve, duration));
	}
}

export default Pollsky;
