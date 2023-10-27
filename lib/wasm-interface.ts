/* eslint @typescript-eslint/ban-types: [off] */
import { Buffer } from './buffer';
import { Mutex } from './mutex';
import { ID, randomID } from './random-id';

const WASM_MODULES = new Map<string, Promise<WebAssembly.Module>>();
const LOAD_MUTEX = new Mutex();

const REDUCE_CALLBACKS = {} as Record<ID, IReduceCallback>;
const U64_MAX = BigInt(1) << BigInt(64); // 2 ** 64
const U32_MAX = Number(2) ** Number(32); // 2 ** 32
const MAX_HEAP = 4 * 1024; // 4 KB

// infer U if T is a Promise<U>, else return T type
type ThenArg<T> = T extends Promise<infer U> ? U : T;

export type IHasher = {
  /**
   * @returns keccak-256 digest of binary data
   */
  digest: (data: Uint8Array) => Uint8Array;
  /**
   * Reduces binary data to a final keccak-256 digest
   * over a range of nonces (inserted at the very end
   * of the data).
   *
   * If the corresponding hash of a nonce value has a
   * number of leading zeros more than specified then
   * the reduction callback is invoked.
   *
   * @returns keccak-256 digest of binary data
   */
  reduce: (data: Uint8Array, options?: {
    /** invoked on enough leading zeros */
    callback?: IReduceCallback;
    /** nonce range to reduce over */
    range?: [bigint, bigint];
    /** number of leading zeros */
    zeros?: number;
  }) => Uint8Array;
}
export type IWASMBinary = {
  name: string; // hasher name
  data: string; // binary data
  hash: string; // data's sha1
}
export type IWASMInterface = ThenArg<
  ReturnType<typeof WASMInterface>
>
export interface IReduceCallback {
  (nonce: bigint, zeros: number, hash: Uint8Array): void;
}
export async function WASMInterface(
  binary: IWASMBinary
): Promise<IHasher> {
  if (typeof WebAssembly === 'undefined') {
    throw new Error('WebAssembly not supported');
  }
  const loader = LOAD_MUTEX.dispatch(load);
  let wasm: WebAssembly.Instance;
  let view: Uint8Array;
  return setup().then(() => ({
    digest, reduce
  }));
  async function setup() {
    if (!wasm) {
      await loader;
    }
    const memory = wasm.exports['memory'] as WebAssembly.Memory;
    const hash_buffer = wasm.exports['Hash_Buffer'] as Function;
    view = new Uint8Array(memory.buffer, hash_buffer(), MAX_HEAP);
  }
  async function load() {
    if (WASM_MODULES.has(binary.name) === false) {
      const buffer = Buffer.from(binary.data, 'base64');
      const module = WebAssembly.compile(await buffer);
      WASM_MODULES.set(binary.name, module);
    }
    const module = await WASM_MODULES.get(binary.name);
    wasm = await WebAssembly.instantiate(module!, {
      env: { Hash_Callback }
    });
  }
  function digest(
    data: Uint8Array
  ): Uint8Array {
    view.set(data);
    const hash_digest = wasm.exports['Hash_Digest'] as Function;
    hash_digest(data.length);
    return view.slice(0, 32);
  }
  function reduce(
    data: Uint8Array, options?: Partial<{
      callback: IReduceCallback;
      range: [bigint, bigint];
      zeros: number;
    }>
  ): Uint8Array {
    if (options === undefined) {
      options = {};
    }
    if (options.callback === undefined) {
      options.callback = () => { /* pass */ };
    }
    if (options.range === undefined) {
      options.range = [BigInt(0), BigInt(1)];
    }
    if (options.zeros === undefined) {
      options.zeros = 0;
    }
    view.set(data);
    const id = randomID(0, U32_MAX);
    REDUCE_CALLBACKS[id] = options.callback;
    const hash_reduce = wasm.exports['Hash_Reduce'] as Function;
    hash_reduce(data.length, id, ...options.range, options.zeros);
    delete REDUCE_CALLBACKS[id];
    return view.slice(0, 32);
  }
  function Hash_Callback(
    id: number, nonce: bigint, level: number
  ) {
    if (id < 0) {
      id = id >>> 0; // int32 => uint32
    }
    if (nonce < 0) {
      nonce += U64_MAX; // int64 => uint64
    }
    REDUCE_CALLBACKS[id](nonce, level, view.slice(0, 32));
  }
}
