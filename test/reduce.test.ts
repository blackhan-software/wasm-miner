import { KeccakHasher } from '../lib';

const hexlify = (a: Uint8Array) => Buffer.from(a).toString('hex');
const encoder = new TextEncoder();
const data = encoder.encode(
  '7437b330e4c2d4e6de751155ebf00abdd2dce294f91e0132c5d6' + // contract ^ account
  '7b228fa7d958cb4cccf1ac9d0c02df47f768cc2036b006f6f21e' + // blockhash
  '0000000000000000' // nonce
);

describe('KeccakHasher', () => {
  it('should reduce(data) over nonces', async () => {
    const hasher = await KeccakHasher();
    const hashed = hasher.reduce(data);
    expect(hexlify(hashed)).toEqual(
      '9fe483af7d5a4f377b55b8164caa10361136e3cda19d04a8a1490295b5f2cb8f'
    );
  });
  it('should reduce(data,{range=[0,0]}) over nonces', async () => {
    const hasher = await KeccakHasher();
    const hashed = hasher.reduce(data, {
      range: [0n, 0n]
    });
    expect(hexlify(hashed)).toEqual(
      '3734333762333330653463326434653664653735313135356562663030616264'
    );
  });
  it('should reduce(data,{range=[0,1]}) over nonces', async () => {
    const hasher = await KeccakHasher();
    const hashed = hasher.reduce(data, {
      range: [0n, 1n]
    });
    expect(hexlify(hashed)).toEqual(
      '9fe483af7d5a4f377b55b8164caa10361136e3cda19d04a8a1490295b5f2cb8f'
    );
  });
  it('should reduce(data,{range=[0,4]}) over nonces', async () => {
    const hasher = await KeccakHasher();
    const hashed = hasher.reduce(data, {
      range: [0n, 4n]
    });
    expect(hexlify(hashed)).toEqual(
      '8c65dc0cdc9b6ef1efbffa2dc1eb8374940335525eb8accb7b94f35651489b0a'
    );
  });
});
describe('KeccakHasher', () => {
  it('should reduce(data,{range=[0,1E6],level>=4}) over nonces', async () => {
    const hasher = await KeccakHasher();
    const hashed = hasher.reduce(data, {
      range: [0n, 10n ** 6n],
      zeros: 4, callback
    });
    expect(hexlify(hashed)).toEqual(
      '1bc30d03ea9606dca227a6b168ff3579b51c6714a1ac2f580b6afa6223c04dc5'
    );
  });
  function callback(
    nonce: bigint, level: number, hash: Uint8Array
  ) {
    console.log(`[on:reduce]`, nonce, level, hexlify(hash));
  }
});
describe('KeccakHasher', () => {
  const compare = (bytes: number[]) => async () => {
    const hasher = await KeccakHasher();
    const u8list = new Uint8Array(bytes);
    const hashed = hasher.reduce(u8list);
    const digest = hasher.digest(u8list);
    expect(digest).toEqual(hashed);
  };
  it('should reduce([0]×0) like digest([0]×0)', compare([]));
  it('should reduce([0]×1) like digest([0]×1)', compare([0]));
  it('should reduce([0]×2) like digest([0]×2)', compare([0, 0]));
  it('should reduce([0]×4) like digest([0]×4)', compare([0, 0, 0, 0]));
  it('should reduce([0]×8) like digest([0]×8)', compare([0, 0, 0, 0, 0, 0, 0, 0]));
});
