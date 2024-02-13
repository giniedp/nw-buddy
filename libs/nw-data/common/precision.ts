export function patchPrecision(value: number, precision = 7) {
  return value ? Number(value.toFixed(precision)) : value
}
