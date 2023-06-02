// TODO: fix number precision during import
export function patchPrecision(value: number) {
  return value ? Number(value.toFixed(8)) : value
}
