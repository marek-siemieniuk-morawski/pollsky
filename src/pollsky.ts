import { AtLeastConditionError, AtMostConditionError, ConditionFunctionError, ExceptionOccurredError } from "./errors";

import { DEBUG } from "./debug";
import { Time } from "./utils";
import { TimeUnit } from "./types";

/**
 * ⛓ Chained Polling Library for Node.js
 * @public
 */
class Pollsky<T> {
	/**
	 * Asynchronous to be polled until `conditionFn()` has returned `true` value
	 * or, if defined, until the master timeout has been called.
	 */
	private asyncFn: () => Promise<T>;

	/**
	 * The number of how many times `asyncFn()` has invoked before `conditionFn()`
	 * returns true.
	 */
	private retries = 0;

	/**
	 * The period of time between the end of the last retry and the next one.
	 * @default { value: 1000, unit: 'milliseconds' }
	 */
	private pollingInterval = new Time({
		interval: 1000,
		unit: 'milliseconds'
	});

	/**
	 * The period of how long `asyncFn()` is invoked until the master timeout has called.
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
	 * Static method created only to be exported and achieve "cleaner" API this way. 
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
		DEBUG && console.log(`Polling started. Parameters:`, { 
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
	 * Makes polling to stop with failure when timeout is called. 
	 */
	atMost(interval: number, unit: TimeUnit): Pollsky<T> {
		this.atMostDuration = new Time({ interval, unit });

		this.atMostTimeout = setTimeout(() => {
			this.atMostTimeoutToBeCalled = true;
		}, this.atMostDuration.toMilliseconds());

		return this;
	}

	/** 
	 * Makes polling to wait at least a certain amount of time until returned the result. 
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
	 * Makes that errors thrown by `asyncFn` are being ignored. 
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
			if (error instanceof AtLeastConditionError) {
				DEBUG && console.log(error.message);
			}

			if (error instanceof ConditionFunctionError) {
				DEBUG && console.log(error.message);
			}

			if (error instanceof AtMostConditionError) {
				DEBUG && console.log(error.message);
				
				throw error;
			}

			if (error instanceof ExceptionOccurredError) {
				if (this.isIgnoreErrors) {
					DEBUG && console.log('Ignoring error: ' + error.message);
				} else {
					DEBUG && console.log(error.message);

					throw error;
				}
			}

			await this.wait(this.pollingInterval.toMilliseconds());

			return this.poll(asyncFn, conditionFn, retries + 1);
		}
	}

	/**
	 * Performs a single execution of `asyncFn` and wraps it with `try catch`
	 * to throw custom error to be handled properly.
	 */
	private async executeAsyncFn<T>(asyncFn: () => Promise<T>): Promise<T> {
		this.retries++;

		try {
			DEBUG && console.log(`Executing asyncFn()... Retry: ${this.retries}`);
			
			return await asyncFn();
		} catch (error) {
			throw new ExceptionOccurredError(error.message);
		}
	}

	/** 
	 * Checks if all conditions are met and if any is not met it throws a customer error. 
	 */
	private checkConditions<T>(result: T, conditionFn: (value: T) => boolean): T {		
		if (this.atMostTimeoutToBeCalled) {	
			throw new AtMostConditionError();
		}

		if (conditionFn(result) === false) {
			throw new ConditionFunctionError();
		}

		if (this.atLeastTimeout) {
			throw new AtLeastConditionError();
		}

		DEBUG && console.log('Polling finished with success - conditionFn() returned `true`');

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
