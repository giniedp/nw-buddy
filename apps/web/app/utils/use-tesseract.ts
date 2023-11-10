export type { ImageLike, WorkerOptions } from 'tesseract.js'

export function useTesseract() {
  return import('tesseract.js')
}
