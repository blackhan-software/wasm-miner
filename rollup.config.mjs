import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

const algos = [
  'keccak'
];
const main_cfg = (minify) => ({
  input: 'lib/index.ts',
  output: [
    {
      file: minify
        ? 'dist/index.umd.min.js'
        : 'dist/index.umd.js',
      name: 'minewasm',
      format: 'umd',
    },
    {
      file: minify
        ? 'dist/index.esm.min.js'
        : 'dist/index.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    json(), typescript(),
    minify ? terser() : null,
  ],
});
const algo_cfg = (minify) => (algo) => ({
  input: `lib/${algo}.ts`,
  output: [
    {
      file: minify
        ? `dist/${algo}.umd.min.js`
        : `dist/${algo}.umd.js`,
      name: 'minewasm',
      format: 'umd',
      extend: true,
    },
    {
      file: minify
        ? `dist/${algo}.esm.min.js`
        : `dist/${algo}.esm.js`,
      format: 'esm',
      extend: true,
    },
  ],
  plugins: [
    json(), typescript(),
    minify ? terser() : null,
  ],
});
export default [
  main_cfg(false), main_cfg(true),
  ...algos.map(algo_cfg(false)),
  ...algos.map(algo_cfg(true)),
];
