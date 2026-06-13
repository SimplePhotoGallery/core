/**
 * Maps over items with a bounded number of concurrent workers, preserving input order in the results.
 *
 * Used to parallelize IO/CPU-bound work (such as thumbnail generation) without spawning unbounded
 * concurrency that would exhaust memory or oversubscribe the CPU. A fixed pool of workers pulls items
 * from a shared cursor; because JavaScript runs the cursor read/increment without interleaving, no
 * locking is required.
 *
 * @param items - The items to process
 * @param concurrency - Maximum number of mapper invocations running at the same time
 * @param mapper - Async function applied to each item; receives the item and its index
 * @returns Promise resolving to the mapped results in the same order as the input
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}
