/**
 * A synchronizer to ensure mutual exclusion around asynchronous tasks.
 */
export class Mutex {
  /**
   * Locks the mutex, so that subsequent lock attempts will have to wait.
   *
   * @returns a promise resolver to unlock the mutex
   */
  lock(): Promise<() => void> {
    // placeholder until real unlock function is assigned
    let anchor: (unlock: () => void) => void = () => { };
    // current mutex promise is chained w/a new one that will resolve
    // when the anchor function is called, locking subsequent tasks
    this.mutex = this.mutex.then(() => new Promise(anchor));
    // promise, when resolved, gives the ability to unlock the mutex; the
    // anchor function is replaced with the actual resolver function
    return new Promise((resolve) => { anchor = resolve; });
  }
  /**
   * Dispatches an asynchronous task under the protection of the mutex.
   * This ensures that the `action` function is executed in isolation,
   * without overlapping with other dispatched actions.
   *
   * @param action asynchronous task to be dispatched under the mutex
   * @returns a promise resolving to the result of the action
   */
  async dispatch<T>(action: () => Promise<T>) {
    // acquire the lock; waits if there are other dispatched tasks
    const unlock = await this.lock();
    try {
      // execute provided action and wait for it to complete (or throw);
      // by awaiting the action's promise, we ensure that any errors are
      // caught in the surrounding try/catch block
      return await Promise.resolve(action());
    } finally {
      unlock(); // always release the mutex
    }
  }
  // mutex starts resolved, so it's initially "unlocked"
  private mutex = Promise.resolve();
}
export default Mutex;
