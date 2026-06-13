import { mapWithConcurrency } from '../src/utils/concurrency';

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('mapWithConcurrency', () => {
  test('should preserve input order in the results', async () => {
    const items = [10, 5, 1, 8, 3];

    // Items with shorter delays resolve first, but results must stay in input order
    const results = await mapWithConcurrency(items, 3, async (value) => {
      await delay(value);
      return value * 2;
    });

    expect(results).toEqual([20, 10, 2, 16, 6]);
  });

  test('should pass the index to the mapper', async () => {
    const items = ['a', 'b', 'c'];

    const results = await mapWithConcurrency(items, 2, async (value, index) => `${value}${index}`);

    expect(results).toEqual(['a0', 'b1', 'c2']);
  });

  test('should never run more than the requested number of workers at once', async () => {
    const concurrency = 3;
    let active = 0;
    let maxActive = 0;

    await mapWithConcurrency(
      Array.from({ length: 20 }, (_, index) => index),
      concurrency,
      async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await delay(2);
        active -= 1;
      },
    );

    expect(maxActive).toBeLessThanOrEqual(concurrency);
  });

  test('should process every item exactly once', async () => {
    const items = Array.from({ length: 50 }, (_, index) => index);
    const seen: number[] = [];

    await mapWithConcurrency(items, 8, async (value) => {
      seen.push(value);
    });

    expect(seen.sort((a, b) => a - b)).toEqual(items);
  });

  test('should handle an empty input', async () => {
    const results = await mapWithConcurrency([], 4, async (value) => value);
    expect(results).toEqual([]);
  });
});
