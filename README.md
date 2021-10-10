# Pollsky

⛓ Chained Polling Library for Node.js

- 💪 Strongly typed
- 🧩 No dependencies
- 👓 Human-readable syntax

## What makes *Pollsky* different?

Just as other Node.js libraries of this purpose, *Pollsky* is built on top of promises, but the unique feature of this package is an almost English-like interface. Instead of:

```
  import 'otherPoller';

  const taskFn = async () => { /** Do something... */ };

  otherPoller({
    taskFn,
    interval: 500,
    timeout: 5000
    // Other options... 
  });
```

you can achieve the same effect with this syntax: 

```
  import { poll } from 'pollsky';

  const taskFn = async () => { /** Does something and returns a string */ };

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

where `waitForSomething` is an async function to keep executing and `checkCondition` - a function that checks if polling has ended successfully.  

By default *Pollsky* does not call timeout and is being executed without the end. If you want to change this behaviour you can define a timeout like this:

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

You can instruct *Pollsky* to wait a certain amount of time
```
  poll(waitForSomething).atMost(30, 'seconds').until(checkCondition);
```

If we don't want *Pollsky* to throw when polling fails we can use `dontThrowError()` to return the last result
```
  poll(waitForSomething).dontThrowError().until(conditionThatFails);
```

## Debugging

1. Enable debug logging - set an environment variable `DEBUG=pollsky` to enable extra logging
```
  # Enabling debug logging
  $ DEBUG=pollsky node script.js
```

2. Error's `failures` object - an error thrown on failure includes property `failures` that contains history of thrown errors
```
  try {
    await poll(async () => 'foo')
      .returnValueIfFailed()
      .atMost(1000, 'milliseconds')
      .until(result => result === 'bar');
  } catch(error) {
    console.log(error.failures);
    // Output:
    // [
    //     {
    //       error: 'ConditionFunctionError',
    //       errorMsg: 'Condition is not met - function `conditionFn() returned `false` instead of `true`.',
    //       result: 'foo',
    //       timestamp: '2021-10-09T16:11:56.925Z'
    //     },
    //     {
    //       error: 'AtMostConditionError',
    //       errorMsg: 'Timeout has called before condition is met.',
    //       result: 'foo',
    //       timestamp: '2021-10-09T16:11:57.927Z'
    //     }
    //   ]
  }
```

## Roadmap

[X] Allow returning a result even if polling failed
[X] Extend error object to contain failures history
[] Allow initialising custom Pollsky object with predefined options
[] Implement increasing interval strategies, fibonacci sequence et al.
[] Add event emitter

## Credits

*Pollsky* is heavily inspired by the [Awaitility](https://github.com/awaitility/awaitility) . Thank you for great Java library.

## License

MIT
