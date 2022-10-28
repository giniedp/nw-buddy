declare const __VERSION__: string
declare const __NW_USE_PTR__: boolean
declare const __NW_DATA_URL__: string
export const env = {
  version: __VERSION__,
  isPTR: __NW_USE_PTR__,
  nwDataUrl: __NW_DATA_URL__
}
