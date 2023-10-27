# WASM Miner with Keccak-256

[![npm package](https://img.shields.io/npm/v/@blackhan-software/wasm-miner.svg)](http://npmjs.org/package/@blackhan-software/wasm-miner)
[![CI Main](https://github.com/blackhan-software/wasm-miner/actions/workflows/main.yaml/badge.svg)](https://github.com/blackhan-software/wasm-miner/actions/workflows/main.yaml)
[![codecov](https://codecov.io/gh/blackhan-software/wasm-miner/graph/badge.svg?token=EESFS0T50M)](https://codecov.io/gh/blackhan-software/wasm-miner)

## Installation

```shell
npm install @blackhan-software/wasm-miner
```

## Usage

```ts
import { KeccakHasher, keccak } from '@blackhan-software/wasm-miner';
```

Prepare a long enough input data array of bytes:
```ts
const encoder = new TextEncoder();
const data = encoder.encode('data:0000000000000000');
```

Digest data using the Keccak 256-bit algorithm:
```ts
const hasher = await KeccakHasher();
const digest: Uint8Array = hasher.digest(data);
console.assert(digest.length === 32);
const hashed: Uint8Array = await keccak(data);
console.assert(hashed.length === 32);
```

Reduce data over `range` invoking `callback` if `hash` of `nonce` has enough leading `zeros`:
```ts
const hasher = await KeccakHasher();
const hashed: Uint8Array = hasher.reduce(data, {
    // invoked in reduction (default: ()=>{})
    callback: (
        nonce: bigint, zeros: number, hash: Uint8Array
    ) => {
        console.assert(nonce >= 0 && nonce < 1e6);
        console.assert(hash.length === 32);
        console.assert(zeros >= 4);
    },
    // [min_nonce, max_nonce] (default: [0n, 1n])
    range: [BigInt(0), BigInt(1e6)],
    // callback filter (default: 0)
    zeros: 4
});
console.assert(hashed.length == 32);
```

## Development

### Installation

```shell
npm install
```

### Lint

```shell
npm run -- lint [--fix]
```

### Build

```shell
npm run build # requires docker
```

### Test

```shell
npm test
```

### Clean

```shell
npm run clean
```

## Copyright

 © 2023 [Blackhan Software Ltd](https://www.linkedin.com/company/blackhan)
