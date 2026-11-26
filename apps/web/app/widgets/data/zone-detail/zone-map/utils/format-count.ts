/**
 * Short point count label: 950, 1.2k, 34k, 2.7M
 */
export function formatCount(value: number) {
  if (!value) {
    return '0'
  }
  if (value < 1000) {
    return String(value)
  }
  if (value < 1_000_000) {
    return trimZero((value / 1000).toFixed(value < 10_000 ? 1 : 0)) + 'k'
  }
  return trimZero((value / 1_000_000).toFixed(1)) + 'M'
}

function trimZero(value: string) {
  return value.endsWith('.0') ? value.slice(0, -2) : value
}
