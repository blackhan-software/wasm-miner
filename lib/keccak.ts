/* eslint @typescript-eslint/ban-types: [off] */
import WASM_JSON from '../wasm/keccak256.wasm.json';

import { Mutex } from './mutex';
import { safe } from './safe-create';
import { IHasher, IWASMInterface, WASMInterface } from './wasm-interface';
export { IHasher };

let WASM: IWASMInterface | undefined;
const SAFE_MUTEX = new Mutex();
/**
 * @returns Keccak hash of data
 */
export async function keccak(
  data: Uint8Array
): Promise<Uint8Array> {
  const wasm = WASM ?? (WASM = await safe(
    () => WASMInterface(WASM_JSON), SAFE_MUTEX
  ));
  return wasm.digest(data);
}
/**
 * @returns a new Keccak hasher instance
 */
export async function KeccakHasher(): Promise<IHasher> {
  const wasm = await WASMInterface(WASM_JSON);
  return {
    digest: (data) => {
      return wasm.digest(data);
    },
    reduce: (data, options) => {
      return wasm.reduce(data, options);
    },
  };
}
