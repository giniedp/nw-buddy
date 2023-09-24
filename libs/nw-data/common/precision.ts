export function patchPrecision(value: number) {
  return value ? Number(value.toFixed(7)) : value
}
