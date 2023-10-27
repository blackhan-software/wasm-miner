import { randomID } from '../lib/random-id';

describe('randomID', () => {
  const [U32_MIN, U32_MAX] = [0, 2 ** 32];
  it('should return a random ID', async () => {
    expect(randomID()).toBeGreaterThanOrEqual(U32_MIN);
    expect(randomID()).toBeLessThan(U32_MAX);
  });
  it('should return a random ID >= 0', async () => {
    expect(randomID(0)).toBeGreaterThanOrEqual(U32_MIN);
  });
  it('should return a random ID < 2 ** 32', async () => {
    expect(randomID(U32_MAX - 1, U32_MAX)).toBeLessThan(U32_MAX);
  });
});
