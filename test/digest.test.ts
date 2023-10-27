/* eslint @typescript-eslint/no-explicit-any: [off] */
import { keccak, KeccakHasher } from '../lib';

const hexlify = (a: Uint8Array) => Buffer.from(a).toString('hex');
const encoder = new TextEncoder();
const data = encoder.encode('a');

describe('KeccakHasher', () => {
  it('should construct default hasher', async () => {
    const digest = await keccak(data);
    const hasher = await KeccakHasher();
    const hashed = hasher.digest(data);
    expect(hashed).toEqual(digest);
  });
});
describe('keccak', () => {
  it('should digest("a") with keccak-256', async () => {
    expect(hexlify(await keccak(encoder.encode('a')))).toEqual(
      '3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb'
    );
  });
  it('should digest("ab") with keccak-256', async () => {
    expect(hexlify(await keccak(encoder.encode('ab')))).toEqual(
      '67fad3bfa1e0321bd021ca805ce14876e50acac8ca8532eda8cbf924da565160'
    );
  });
  it('should digest("abc") with keccak-256', async () => {
    expect(hexlify(await keccak(encoder.encode('abc')))).toEqual(
      '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45'
    );
  });
});
