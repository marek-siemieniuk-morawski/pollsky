import { AtMostConditionError, ExceptionOccurredError } from '../src/errors';

import { Timer } from './helpers';
import { expect } from 'chai';
import { poll } from '../src';

describe('Pollsky', function () {
  describe('until()', function () {
    it('returns a value of asyncFn() if conditionFn() returns `true` immedietly', async function () {
      const asyncFnThatIsResolvedImmedietly = async () => 'foo';

      const conditionFnThatReturnsTrue = (value: string) => value === 'foo';

      const result = await poll(asyncFnThatIsResolvedImmedietly).until(conditionFnThatReturnsTrue);

      expect(result).to.be.equal('foo');
    });

    it('returns the value of asyncFn() if conditionFn() returns `true` after a while', async function () {
      const timer = new Timer();

      const asyncFnThatTakesSecondToBeResolved = async () => 
        new Promise<string>(resolve => setTimeout(() => { resolve('foo'); }, 1000));

      const conditionFnThatReturnsTrue = (value: string) => value === 'foo';

      timer.start();

      const result = await poll(asyncFnThatTakesSecondToBeResolved).until(conditionFnThatReturnsTrue);

      timer.stop();

      expect(result).to.be.equal('foo');
      expect(timer.isExecutedInTime(1000)).be.true;
    });

    it('throws AtMostConditionError if atMost() is used and conditionFn() doesn\'t return "true" before timeout is called', async function () {
      const asyncFnThatIsResolvedImmedietly = async () => 'foo';

      const conditionFnThatReturnsFalse = (value: string) => value === 'bar';

      try {
        await poll(asyncFnThatIsResolvedImmedietly)
          .atMost(1000, 'milliseconds')
          .until(conditionFnThatReturnsFalse);
      } catch (error) {
        expect(error).to.be.instanceOf(AtMostConditionError);
      }
    });

    it('changes default interval duration when used .withInterval()', async function() {
      const timer = new Timer();

      const asyncFnThatIsResolvedInTwoSeconds = async () => 
        new Promise<string>(resolve => setTimeout(() => { resolve('foo'); }, 2 * 1000));

      const conditionFnThatReturnsTrue = (value: string) => value === 'foo';

      timer.start();

      await poll(asyncFnThatIsResolvedInTwoSeconds)
        .withInterval(2 * 1000, 'milliseconds')
        .until(conditionFnThatReturnsTrue);

      timer.stop()

      expect(timer.isExecutedInTime(2 * 1000)).be.true;
    });

    it('waits a certain amount of time until returned the result if .atLeast() is used', async function() {
      const timer = new Timer();

      const asyncFnThatIsResolvedImmedietly = async () => 'foo';

      const conditionFnThatReturnsTrue = (value: string) => value === 'foo';

      timer.start();

      await poll(asyncFnThatIsResolvedImmedietly)
        .atLeast(2 * 1000, 'milliseconds')
        .until(conditionFnThatReturnsTrue);

      timer.stop()

      expect(timer.isExecutedInTime(2 * 1000)).be.true;
    });

    it('ends polling and throws an error if asyncFn() throws an error', async function() {
      const asyncFnThatThrowsErrorImmedietly = async (): Promise<string> => { throw new Error('Ups...'); }

      const conditionFnThatNeverBeUsed = (value: string) => value === 'foo';

      try {
        await poll(asyncFnThatThrowsErrorImmedietly).until(conditionFnThatNeverBeUsed);
      } catch (error) {
        expect(error).to.be.instanceOf(ExceptionOccurredError);
      }
    });

    it('ignore errors thrown by asyncFn() if .ignoreErrors() is used', async function() {
      const getAsyncFnThatThrowsErrorsButEventuallyIsResolved = () => {
        let timeToBeResolved = false;

        setTimeout(() => { timeToBeResolved = true; }, 2 * 1000);

        return () => new Promise<string>(resolve => {
          if (timeToBeResolved) {
            resolve('foo')
          }

          throw new Error('Ups...');
        });
      }

      const conditionFnThatReturnsTrue = (value: string) => value === 'foo';

      const result = await poll(getAsyncFnThatThrowsErrorsButEventuallyIsResolved())
        .ignoreErrors()
        .until(conditionFnThatReturnsTrue);

      expect(result).to.be.equal('foo');
    });
  });
});
