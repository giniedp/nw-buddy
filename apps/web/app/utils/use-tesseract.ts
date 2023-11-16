export type { ImageLike, WorkerOptions } from 'tesseract.js'

export async function useTesseract() {
  const module = await import('tesseract.js')
  if ('default' in module) {
    return module.default
  }
  return module
}
