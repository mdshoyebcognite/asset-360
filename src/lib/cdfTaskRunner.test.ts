import { describe, expect, it } from 'vitest';

import { QueuedTaskRunner } from './cdfTaskRunner';

describe(QueuedTaskRunner.name, () => {
  it('should run tasks with at most maxConcurrent in flight', async () => {
    const runner = new QueuedTaskRunner(2);
    let inFlight = 0;
    let maxObserved = 0;

    const task = () =>
      new Promise<number>((resolve) => {
        inFlight += 1;
        maxObserved = Math.max(maxObserved, inFlight);
        setTimeout(() => {
          inFlight -= 1;
          resolve(1);
        }, 20);
      });

    await Promise.all([
      runner.schedule(task),
      runner.schedule(task),
      runner.schedule(task),
      runner.schedule(task),
    ]);

    expect(maxObserved).toBeLessThanOrEqual(2);
  });

  it('should resolve tasks in FIFO order', async () => {
    const runner = new QueuedTaskRunner(1);
    const order: number[] = [];

    await runner.schedule(async () => {
      order.push(1);
    });
    await runner.schedule(async () => {
      order.push(2);
    });

    expect(order).toEqual([1, 2]);
  });

  it('should propagate rejections', async () => {
    const runner = new QueuedTaskRunner(1);
    await expect(
      runner.schedule(() => Promise.reject(new Error('fail'))),
    ).rejects.toThrow('fail');
  });
});
