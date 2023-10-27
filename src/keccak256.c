/**
 * keccak256.c: an implementation of Secure Hash Algorithm 3 (Keccak-256)
 */
#include "keccak256.h"

#define ROUNDS 24
#define MAX_PERMUTATIONS 25
#define MAX_RATE_QWORDS 24
#define BLOCK_SIZE 136
#define FINALIZED 0x80000000

#define I64(x) x##ULL
#define ROTL64(qword, n) ((qword) << (n) ^ ((qword) >> (64 - (n))))

struct Context
{
  /* 1600 bits algorithm hashing state */
  uint64_t hash[MAX_PERMUTATIONS];
  /* 1536-bit buffer for leftovers */
  uint64_t data[MAX_RATE_QWORDS];
  /* number of bytes in data[] */
  unsigned rest;
};

struct Context _ctx;
struct Context *ctx = &_ctx;

/* Keccak constants over rounds */
static const uint64_t ROUND_CONSTANTS[ROUNDS] = {
    I64(0x0000000000000001), I64(0x0000000000008082), I64(0x800000000000808A), I64(0x8000000080008000),
    I64(0x000000000000808B), I64(0x0000000080000001), I64(0x8000000080008081), I64(0x8000000000008009),
    I64(0x000000000000008A), I64(0x0000000000000088), I64(0x0000000080008009), I64(0x000000008000000A),
    I64(0x000000008000808B), I64(0x800000000000008B), I64(0x8000000000008089), I64(0x8000000000008003),
    I64(0x8000000000008002), I64(0x8000000000000080), I64(0x000000000000800A), I64(0x800000008000000A),
    I64(0x8000000080008081), I64(0x8000000000008080), I64(0x0000000080000001), I64(0x8000000080008008)};

/* Initialize Keccak context */
void Hash_Init()
{
  for (int i = 0; i < MAX_PERMUTATIONS; i++)
  {
    ctx->hash[i] = 0;
  }
  for (int i = 0; i < MAX_RATE_QWORDS; i++)
  {
    ctx->data[i] = 0;
  }
  ctx->rest = 0;
}

#define XORED_S(i) \
  S[(i)] ^ S[(i) + 5] ^ S[(i) + 10] ^ S[(i) + 15] ^ S[(i) + 20]
#define THETA_STEP(i)    \
  S[(i)] ^= D[(i)];      \
  S[(i) + 5] ^= D[(i)];  \
  S[(i) + 10] ^= D[(i)]; \
  S[(i) + 15] ^= D[(i)]; \
  S[(i) + 20] ^= D[(i)]

/* Keccak theta transformation */
static void keccak_theta(uint64_t *S)
{
  uint64_t D[5];
  D[0] = ROTL64(XORED_S(1), 1) ^ XORED_S(4);
  D[1] = ROTL64(XORED_S(2), 1) ^ XORED_S(0);
  D[2] = ROTL64(XORED_S(3), 1) ^ XORED_S(1);
  D[3] = ROTL64(XORED_S(4), 1) ^ XORED_S(2);
  D[4] = ROTL64(XORED_S(0), 1) ^ XORED_S(3);
  THETA_STEP(0);
  THETA_STEP(1);
  THETA_STEP(2);
  THETA_STEP(3);
  THETA_STEP(4);
}

/* Keccak pi transformation */
static void keccak_pi(uint64_t *S)
{
  uint64_t S1;
  S1 = S[1];
  S[1] = S[6];
  S[6] = S[9];
  S[9] = S[22];
  S[22] = S[14];
  S[14] = S[20];
  S[20] = S[2];
  S[2] = S[12];
  S[12] = S[13];
  S[13] = S[19];
  S[19] = S[23];
  S[23] = S[15];
  S[15] = S[4];
  S[4] = S[24];
  S[24] = S[21];
  S[21] = S[8];
  S[8] = S[16];
  S[16] = S[5];
  S[5] = S[3];
  S[3] = S[18];
  S[18] = S[17];
  S[17] = S[11];
  S[11] = S[7];
  S[7] = S[10];
  S[10] = S1;
}

#define CHI_STEP(i)                       \
  S0 = S[0 + (i)];                        \
  S1 = S[1 + (i)];                        \
  S[0 + (i)] ^= ~S1 & S[2 + (i)];         \
  S[1 + (i)] ^= ~S[2 + (i)] & S[3 + (i)]; \
  S[2 + (i)] ^= ~S[3 + (i)] & S[4 + (i)]; \
  S[3 + (i)] ^= ~S[4 + (i)] & S0;         \
  S[4 + (i)] ^= ~S0 & S1

/* Keccak chi transformation */
static void keccak_chi(uint64_t *S)
{
  uint64_t S0, S1;
  CHI_STEP(0);
  CHI_STEP(5);
  CHI_STEP(10);
  CHI_STEP(15);
  CHI_STEP(20);
}

/* Keccak rho transformation */
static void keccak_rho(uint64_t *S)
{
  S[1] = ROTL64(S[1], 1);
  S[2] = ROTL64(S[2], 62);
  S[3] = ROTL64(S[3], 28);
  S[4] = ROTL64(S[4], 27);
  S[5] = ROTL64(S[5], 36);
  S[6] = ROTL64(S[6], 44);
  S[7] = ROTL64(S[7], 6);
  S[8] = ROTL64(S[8], 55);
  S[9] = ROTL64(S[9], 20);
  S[10] = ROTL64(S[10], 3);
  S[11] = ROTL64(S[11], 10);
  S[12] = ROTL64(S[12], 43);
  S[13] = ROTL64(S[13], 25);
  S[14] = ROTL64(S[14], 39);
  S[15] = ROTL64(S[15], 41);
  S[16] = ROTL64(S[16], 45);
  S[17] = ROTL64(S[17], 15);
  S[18] = ROTL64(S[18], 21);
  S[19] = ROTL64(S[19], 8);
  S[20] = ROTL64(S[20], 18);
  S[21] = ROTL64(S[21], 2);
  S[22] = ROTL64(S[22], 61);
  S[23] = ROTL64(S[23], 56);
  S[24] = ROTL64(S[24], 14);
}

/* Keccak iota transformation */
static void keccak_iota(
    uint64_t *S, const int round)
{
  *S ^= ROUND_CONSTANTS[round];
}

/* Keccak permutation */
static void keccak_permutation(uint64_t *S)
{
  for (int r = 0; r < ROUNDS; r++)
  {
    keccak_theta(S);
    keccak_rho(S);
    keccak_pi(S);
    keccak_chi(S);
    keccak_iota(S, r);
  }
}

/* Core transformation: process specified block */
static void keccak_process_block(
    uint64_t state[25], const uint64_t *block)
{
  state[0] ^= block[0];
  state[1] ^= block[1];
  state[2] ^= block[2];
  state[3] ^= block[3];
  state[4] ^= block[4];
  state[5] ^= block[5];
  state[6] ^= block[6];
  state[7] ^= block[7];
  state[8] ^= block[8];
  state[9] ^= block[9];
  state[10] ^= block[10];
  state[11] ^= block[11];
  state[12] ^= block[12];
  state[13] ^= block[13];
  state[14] ^= block[14];
  state[15] ^= block[15];
  state[16] ^= block[16];
  keccak_permutation(state);
}

/**
 * Calculate hash; can be called repeatedly (over chunks)
 */
void Hash_Update(uint32_t length)
{
  const uint8_t *data = hash_buffer;
  uint32_t rest = (uint32_t)ctx->rest;
  if (rest & FINALIZED)
  {
    return; // too late for additional input
  }
  ctx->rest = (unsigned)((ctx->rest + length) % BLOCK_SIZE);
  // fill partial block
  if (rest)
  {
    uint32_t left = BLOCK_SIZE - rest;
    uint32_t end = length < left ? length : left;
    uint8_t *data_ptr = (uint8_t *)ctx->data + rest;
    for (uint32_t i = 0; i < end; i++)
    {
      data_ptr[i] = data[i];
    }
    if (length < left)
    {
      return;
    }
    // process partial block
    keccak_process_block(ctx->hash, ctx->data);
    data += left;
    length -= left;
  }
  while (length >= BLOCK_SIZE)
  {
    uint64_t *aligned_message_block = (uint64_t *)data;
    keccak_process_block(ctx->hash, aligned_message_block);
    data += BLOCK_SIZE;
    length -= BLOCK_SIZE;
  }
  if (length)
  {
    // save leftovers
    uint8_t *data_ptr = (uint8_t *)ctx->data;
    for (uint8_t i = 0; i < length; i++)
    {
      data_ptr[i] = data[i];
    }
  }
}

/**
 * Finalize hash
 */
void Hash_Final()
{
  if (!(ctx->rest & FINALIZED))
  {
    // clear rest of data queue
    int8_t *start = (int8_t *)ctx->data + ctx->rest;
    for (int i = 0; i < BLOCK_SIZE - ctx->rest; i++)
    {
      start[i] = 0;
    }
    ((int8_t *)ctx->data)[ctx->rest] |= 0x01;
    ((int8_t *)ctx->data)[BLOCK_SIZE - 1] |= 0x80;
    // process final block
    keccak_process_block(ctx->hash, ctx->data);
    ctx->rest = FINALIZED;
  }
}

/**
 * Copy calculated hash to target buffer
 */
void Hash_Copy()
{
  uint32_t *target = (uint32_t *)hash_buffer;
  uint32_t *source = (uint32_t *)ctx->hash;
#pragma clang loop unroll(full)
  for (int i = 0; i < 8; i++)
  {
    target[i] = source[i];
  }
}

/**
 * Hash digest: init . update(data.length) . final
 */
void Hash_Digest(const uint32_t data_length)
{
  Hash_Init();
  Hash_Update(data_length);
  Hash_Final();
  Hash_Copy();
}

/**
 * @return number of leading zeros of hash
 */
uint32_t Hash_Zeros(uint32_t counter)
{
  while (hash_buffer[counter] == 0)
  {
    counter++;
  }
  if (hash_buffer[counter] < 16)
  {
    return 2 * counter + 1;
  }
  else
  {
    return 2 * counter;
  }
}

/**
 * Invoke callback if hash has enough leading zeros
 */
void Hash_CallbackIf(
    const uint32_t callback_id, const uint64_t nonce, const uint32_t zeros_min)
{
  const uint32_t zeros = Hash_Zeros(0);
  if (zeros >= zeros_min)
  {
    Hash_Callback(callback_id, nonce, zeros);
  }
}

/**
 * Set prefix of temp buffer till offset with input value
 */
void Hash_Backup(const uint32_t offset)
{
  memcpy(temp_buffer, hash_buffer, offset);
}

/**
 * Set prefix of hash buffer till offset with input value
 */
void Hash_Prefix(const uint32_t offset)
{
  memcpy(hash_buffer, temp_buffer, offset);
}

/**
 * Set suffix of hash buffer from offset with nonce value
 */
void Hash_Suffix(const uint32_t offset, const uint64_t nonce)
{
  hash_buffer[offset + 0] = (uint8_t)(nonce >> 56);
  hash_buffer[offset + 1] = (uint8_t)(nonce >> 48);
  hash_buffer[offset + 2] = (uint8_t)(nonce >> 40);
  hash_buffer[offset + 3] = (uint8_t)(nonce >> 32);
  hash_buffer[offset + 4] = (uint8_t)(nonce >> 24);
  hash_buffer[offset + 5] = (uint8_t)(nonce >> 16);
  hash_buffer[offset + 6] = (uint8_t)(nonce >> 8);
  hash_buffer[offset + 7] = (uint8_t)(nonce);
}

/**
 * Hash reduce over nonces with conditional callback
 */
void Hash_Reduce(
    const uint32_t data_length,
    const uint32_t callback_id,
    const uint64_t nonce_min,
    const uint64_t nonce_max,
    const uint32_t zeros_min)
{
  const uint32_t offset = data_length > 8 ? data_length - 8 : 0;
  Hash_Backup(offset);
  for (uint64_t n = nonce_min; n < nonce_max; n++)
  {
    Hash_Prefix(offset);
    Hash_Suffix(offset, n);
    Hash_Digest(data_length);
    Hash_CallbackIf(callback_id, n, zeros_min);
  }
}

/**
 * @return main hash buffer
 */
const uint8_t *Hash_Buffer()
{
  return hash_buffer;
}
