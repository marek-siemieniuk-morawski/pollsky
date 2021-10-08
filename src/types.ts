export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes';

export interface ErrorProperties<T> {
	timestamp: string;
	result?: T;
}

export interface ErrorDetails<T> extends ErrorProperties<T> {
	message: string;
}

export interface Failure<T> {
	error: string;
	errorMsg: string;
	result?: T;
	timestamp: string
}
