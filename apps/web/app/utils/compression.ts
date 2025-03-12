import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export function decompressQueryParam<T>(value: string): T | null {
  if (!value) {
    return null
  }
  try {
    return JSON.parse(decompressFromEncodedURIComponent(value))
  } catch (e) {
    console.error('Failed to decode state', e)
    return null
  }
}

export function compressQueryParam(value: any) {
  return compressToEncodedURIComponent(JSON.stringify(value))
}
