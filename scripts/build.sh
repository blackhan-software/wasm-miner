#!/bin/bash
###############################################################################
set -e

mkdir -p dist
mkdir -p wasm
npm run lint

# build docker image
if [[ "$(docker images -q clang:wasm-miner 2> /dev/null)" == "" ]]; then
  docker build -f scripts/Dockerfile -t clang:wasm-miner .
fi

# copy to docker volume
docker rm wasm-miner-tmp || true
docker volume rm wasm-miner-vol || true
docker container create --name wasm-miner-tmp -v wasm-miner-vol:/app busybox
docker cp . wasm-miner-tmp:/app

# compile code
docker run --rm \
  -v wasm-miner-vol:/app -u $(id -u):$(id -g) \
  clang:wasm-miner make -f /app/scripts/Makefile-clang \
  --silent --always-make --output-sync=target -j8 all

# copy output back
docker cp wasm-miner-tmp:/app/wasm/ .
docker rm wasm-miner-tmp
docker volume rm wasm-miner-vol

# make $ALGO.wasm.json
node scripts/make-json.js

# build distributables
node --max-old-space-size=4096 ./node_modules/rollup/dist/bin/rollup -c

# transpile scripts
npx tsc ./lib/index \
  --outDir ./dist \
  --emitDeclarationOnly \
  --declaration \
  --resolveJsonModule \
  --allowSyntheticDefaultImports

###############################################################################
###############################################################################
