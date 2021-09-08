export class Timer {

  private static ACCEPTABLE_TIME_MARGIN = 50; 

  private startTime?: Date;

  private stopTime?: Date;

  start(): void {
    this.startTime = new Date();
  }

  stop(): void {
    this.stopTime = new Date();
  }

  isExecutedInTime(expectedTime: number): boolean {
    if (!this.startTime || !this.stopTime) {
      throw new Error('Timer is not started or stopped.');
    }

    const diff = this.startTime.getMilliseconds() - this.stopTime.getMilliseconds();

    return expectedTime - diff < Timer.ACCEPTABLE_TIME_MARGIN || expectedTime + diff > Timer.ACCEPTABLE_TIME_MARGIN;
  }
}