import { TimeUnit } from "./types";

/**
 * Properties of `Time` class constructor
 */
interface TimeAttributes {
	interval: number;
	unit: TimeUnit;
}

/**
 * 🔧 Helper class to store time interval and units of time.
 */
export class Time {
	/**
	 * Time unit duration multiplayer.
	 */
	private static TIME_UNIT_MULTIPLIER: { [key in TimeUnit]: number } = {
    'milliseconds': 1,
    'seconds': 1000,
    'minutes': 60 * 1000
  }

	/**
	 * Time value
	 */
	interval: number;

	/**
	 * Time unit.
	 */
	unit: TimeUnit;

	constructor(attributes: TimeAttributes) {
		this.interval = attributes.interval;
		this.unit = attributes.unit;
	}

	/**
	 * Converts an object to milliseconds.
	 */
	toMilliseconds(): number {
		return this.interval * Time.TIME_UNIT_MULTIPLIER[this.unit];
	}
}

export const getTimestamp = () => new Date().toISOString();
