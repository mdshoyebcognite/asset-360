type Task<T> = () => Promise<T>;

/**
 * Limits concurrent CDF requests to avoid hammering DMS and reduce 429 risk.
 */
export class QueuedTaskRunner {
  private activeCount = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number) {}

  schedule<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        this.activeCount += 1;
        void task()
          .then(resolve, reject)
          .finally(() => {
            this.activeCount -= 1;
            const next = this.queue.shift();
            if (next) {
              next();
            }
          });
      };

      if (this.activeCount < this.maxConcurrent) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

export const cdfTaskRunner = new QueuedTaskRunner(5);
