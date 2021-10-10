export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes';

export interface Failure<T> {
	error: string;
	errorMsg: string;
	result?: T;
	timestamp: string
}
