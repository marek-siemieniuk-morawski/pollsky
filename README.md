# Pollsky

⛓ Chained Polling Library for Node.js

## What makes *Pollsky* different?

Just as other Node.js libraries of this purpose, *Pollsky* is built on top of promises but the unique feature of this package is an almost English-like interface. Instead of:

```
import 'otherPoller';

const taskFn = async () => { /** Do something... */ };

otherPoller({
  taskFn,
  interval: 500,
  timeout: 5000
  // Other options... 
})
```

you can achieve the same effect with a syntax like this: 

```
import { poll } from 'pollsky';

const taskFn = async () => { /** Do something and returns a string */ };

const conditionFn = value => value === 'foo';

const poll(taskFn).atMost(5000, 'milliseconds').withInterval(500, 'milliseconds').until(conditionFn);
```

## Installation

Using npm:

```
$ npm install pollsky
```

Using yarn:

```
$ yarn add pollsky
```

## Usage

The simpliest use case:

```
poll(waitForSomething).until(checkCondition);
```

where `waitForSomething` is an async function to be kept executing and `checkCondition` a function that checks if polling is ended successfully.  

By default *Pollsky* does not call timeout and it's being executed without the end. If you want to change this behaviour you can define a timeout this way:

```
// In seconds...
poll(waitForSomething).atMost(20, 'seconds').until(checkCondition);

// ...and in milliseconds if you like
poll(waitForSomething).atMost(500, 'milliseconds').until(checkCondition);
```

Using `withInterval()` we can change the polling interval:
```
poll(waitForSomething).withInterval(5, 'seconds').until(checkCondition);

// We can easily chain methods however we want
poll(waitForSomething).withInterval(5, 'seconds').atMost(2, 'minutes').until(checkCondition);
```

It's sometimes useful to ignore exceptions during condition evaluation.
```
poll(waitForSomething).ignoreErrors().until(checkCondition);
```

You can instruct *Pollsky* wait at least a certain amount of time
```
poll(waitForSomething).atMost(30, 'seconds').until(checkCondition);
```

## Credits

*Pollsky* is heavily inspired by the [Awaitility](https://github.com/awaitility/awaitility) . Thank you for great Java library.

## License

MIT
