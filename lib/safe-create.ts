import { Mutex } from './mutex';
/**
 * Wraps the execution of an asynchronous object creation function with
 * a mutex. This ensures, that the `create` function is safely executed
 * without being interrupted by other asynchronous tasks under the same
 * mutex.
 *
 * @param create asynchronous function responsible for object creation
 * @param mutex instance used to ensure the safe execution of `create`
 *
 * @returns a promise resolving to the created object
 */
export async function safe<T>(
  create: () => Promise<T>, mutex: Mutex
): Promise<T> {
  const unlock = await mutex.lock();
  const object = await create();
  unlock(); // release mutex
  return object;
}
export default safe;
