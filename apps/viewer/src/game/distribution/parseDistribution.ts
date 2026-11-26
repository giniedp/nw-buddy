import type { RegionDistributionData } from '../../api'

/**
 * Instances of one distribution type inside a cell.
 */
export interface DistributionRun {
  /**
   * Index into {@link RegionDistributionData.types}
   */
  type: number
  /**
   * Start index into {@link DistributionData.order}
   */
  start: number
  /**
   * Number of instances
   */
  count: number
}

export interface DistributionCell {
  /**
   * Cell index in x direction
   */
  x: number
  /**
   * Cell index in y direction
   */
  y: number
  /**
   * Cell index in the grid, `y * cellsPerAxis + x`
   */
  index: number
  runs: DistributionRun[]
}

export interface DistributionData {
  header: RegionDistributionData
  /**
   * Type index per instance
   */
  types: Uint16Array
  /**
   * Region local x per instance, 0..0xFFFF maps to 0..regionSize
   */
  posX: Uint16Array
  /**
   * Region local y per instance, 0..0xFFFF maps to 0..regionSize
   */
  posY: Uint16Array
  /**
   * Uniform scale per instance in hundredths, empty for data without it
   */
  scales: Uint8Array
  /**
   * Packed rotation per instance (see {@link unpackRotation}), empty for data without it
   */
  rotations: Uint32Array
  /**
   * Instance indices sorted by cell and type
   */
  order: Uint32Array
  /**
   * Number of cells per axis
   */
  cellsPerAxis: number
  /**
   * Non empty cells
   */
  cells: DistributionCell[]
}

/**
 * Writes the quaternion (x, y, z, w) of a packed placement rotation into `out`: x and y in 10 bits over 255, z in
 * 11 bits over 511, each less one, w rebuilt from them and negative with the top bit, normalised
 */
export function unpackRotation(packed: number, out: Float32Array | number[]) {
  const x = ((packed >>> 21) & 0x3ff) / 255 - 1
  const y = ((packed >>> 11) & 0x3ff) / 255 - 1
  const z = (packed & 0x7ff) / 511 - 1
  let w = Math.sqrt(Math.max(0, 1 - Math.min(1, x * x + y * y + z * z)))
  if (packed & 0x80000000) {
    w = -w
  }
  const length = Math.hypot(x, y, z, w) || 1
  out[0] = x / length
  out[1] = y / length
  out[2] = z / length
  out[3] = w / length
}

/**
 * Wraps the binary instance data and buckets the instances into cells of a regular grid
 *
 * @param header - the distribution header
 * @param data - the binary instance data
 * @param cellsPerAxis - number of cells per region axis, must be a power of two
 */
export function parseDistribution(
  header: RegionDistributionData,
  data: ArrayBuffer,
  cellsPerAxis: number,
): DistributionData {
  const count = header.count
  const types = new Uint16Array(data, 0, count)
  const posX = new Uint16Array(data, count * 2, count)
  const posY = new Uint16Array(data, count * 4, count)
  const rotationOffset = Math.ceil((count * 7) / 4) * 4
  const hasPlacement = data.byteLength >= rotationOffset + count * 4
  const scales = hasPlacement ? new Uint8Array(data, count * 6, count) : new Uint8Array(0)
  const rotations = hasPlacement ? new Uint32Array(data, rotationOffset, count) : new Uint32Array(0)

  // counting sort by bucket = cell * typeCount + type
  const typeCount = header.types.length
  const cellShift = 16 - Math.log2(cellsPerAxis)
  const bucketCount = cellsPerAxis * cellsPerAxis * typeCount
  const bucketStart = new Uint32Array(bucketCount + 1)
  const buckets = new Uint32Array(count)
  for (let i = 0; i < count; i++) {
    const cell = (posY[i] >> cellShift) * cellsPerAxis + (posX[i] >> cellShift)
    const bucket = cell * typeCount + types[i]
    buckets[i] = bucket
    bucketStart[bucket + 1]++
  }
  for (let i = 0; i < bucketCount; i++) {
    bucketStart[i + 1] += bucketStart[i]
  }
  const order = new Uint32Array(count)
  const cursor = bucketStart.slice(0, bucketCount)
  for (let i = 0; i < count; i++) {
    order[cursor[buckets[i]]++] = i
  }

  const cells: DistributionCell[] = []
  for (let cellIndex = 0; cellIndex < cellsPerAxis * cellsPerAxis; cellIndex++) {
    let cell: DistributionCell = null
    for (let type = 0; type < typeCount; type++) {
      const bucket = cellIndex * typeCount + type
      const start = bucketStart[bucket]
      const runCount = bucketStart[bucket + 1] - start
      if (!runCount) {
        continue
      }
      if (!cell) {
        cell = {
          x: cellIndex % cellsPerAxis,
          y: Math.floor(cellIndex / cellsPerAxis),
          index: cellIndex,
          runs: [],
        }
        cells.push(cell)
      }
      cell.runs.push({ type, start, count: runCount })
    }
  }

  return {
    header,
    types,
    posX,
    posY,
    scales,
    rotations,
    order,
    cellsPerAxis,
    cells,
  }
}
