#ifndef KECCAK256_H
#define KECCAK256_H

#include <stdint.h>
#include <stdalign.h>

#define WASM_EXPORT __attribute__((visibility("default")))
alignas(128) uint8_t hash_buffer[4 * 1024]; // 4 KB
alignas(128) uint8_t temp_buffer[4 * 1024]; // 4 KB

WASM_EXPORT
const uint8_t *Hash_Buffer();
WASM_EXPORT
void Hash_Digest(uint32_t);
WASM_EXPORT
void Hash_Reduce(uint32_t, uint32_t, uint64_t, uint64_t, uint32_t);

/* Callback within each of the hash-reduce iterations */
extern void Hash_Callback(uint32_t, uint64_t, uint32_t);

static __inline__ void *memcpy(
    void *target, const void *source, int size)
{
  uint8_t *tgt = (uint8_t *)target;
  uint8_t *src = (uint8_t *)source;
  for (int i = 0; i < size; i++)
  {
    tgt[i] = src[i];
  }
  return target;
}

#endif
