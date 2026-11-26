/**
 * Gets the first index where `distance <= thresholds[index]`
 * @param distance
 * @param thresholds
 * @returns
 */
export function getLOD(distance: number, thresholds: ReadonlyArray<number>): number | null {
  for (let i = 0; i < thresholds.length; i++) {
    if (distance <= thresholds[i]) {
      return i
    }
  }
  return -1
}
