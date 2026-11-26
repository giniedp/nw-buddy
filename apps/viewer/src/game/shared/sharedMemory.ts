/**
 * Whether SharedArrayBuffer can be used, requires a cross origin isolated page (see vite.config.ts headers)
 */
export function isSharedMemoryAvailable() {
  return typeof SharedArrayBuffer !== 'undefined' && !!globalThis.crossOriginIsolated
}

/**
 * Allocates a buffer that can be shared with workers, falls back to an ArrayBuffer (copied on postMessage)
 */
export function allocateShared(byteLength: number): ArrayBufferLike {
  return isSharedMemoryAvailable() ? new SharedArrayBuffer(byteLength) : new ArrayBuffer(byteLength)
}

/**
 * Copies the bytes of a buffer into a buffer that can be shared with workers
 */
export function copyToShared(buffer: ArrayBuffer): ArrayBufferLike {
  const result = allocateShared(buffer.byteLength)
  new Uint8Array(result).set(new Uint8Array(buffer))
  return result
}
