/**
 * Reader for the original `region.vegetation` file, see `formats/vegetation` in nwbt for the layout.
 *
 * Block 0 is the asset table, block i (i > 0) holds the instances of cell i - 1:
 *
 *   u16 groupCount, groupCount * { u16 asset, u16 count, count * 16 byte instance }
 *
 * Instance: u32 rotation | u16 x | u16 y | u16 height | u8 scale | u8 - | u16 source | u16 -
 */

const HEADER_SIZE = 8
const GROUP_HEADER_SIZE = 4
export const VEGETATION_INSTANCE_SIZE = 16
export const VEGETATION_INSTANCE_WORDS = VEGETATION_INSTANCE_SIZE / 4

export interface VegetationCellGroup {
  asset: number
  count: number
}

export interface VegetationCell {
  /**
   * Row major cell index, x fastest
   */
  index: number
  x: number
  y: number
  /**
   * Byte range of the cell block (including the group count)
   */
  start: number
  end: number
  count: number
  groups: VegetationCellGroup[]
}

export interface VegetationFile {
  tileSize: number
  regionSize: number
  cellsPerAxis: number
  maxInstancesPerCell: number
  /**
   * Total number of instances
   */
  count: number
  /**
   * Non empty cells
   */
  cells: VegetationCell[]
  /**
   * Non empty cells by cell index
   */
  cellByIndex: Map<number, VegetationCell>
  bytes: Uint8Array
}

export function parseVegetation(buffer: ArrayBuffer): VegetationFile {
  const view = new DataView(buffer)
  const tileSize = view.getUint16(0, true)
  const regionSize = view.getUint16(2, true)
  const maxInstancesPerCell = view.getUint32(4, true)
  const cellsPerAxis = tileSize ? regionSize / tileSize : 0
  const blockCount = cellsPerAxis * cellsPerAxis
  const dataStart = HEADER_SIZE + blockCount * 4
  if (!blockCount || buffer.byteLength < dataStart) {
    throw new Error(`invalid vegetation header ${tileSize} ${regionSize}`)
  }

  const cells: VegetationCell[] = []
  const cellByIndex = new Map<number, VegetationCell>()
  let count = 0
  let start = view.getUint32(HEADER_SIZE, true) // end of block 0 (asset table)
  for (let block = 1; block < blockCount; block++) {
    const end = view.getUint32(HEADER_SIZE + block * 4, true)
    if (end - start > 2) {
      const index = block - 1
      const cell: VegetationCell = {
        index,
        x: index % cellsPerAxis,
        y: Math.floor(index / cellsPerAxis),
        start,
        end,
        count: 0,
        groups: [],
      }
      const groupCount = view.getUint16(start, true)
      let pos = start + 2
      for (let g = 0; g < groupCount && pos + GROUP_HEADER_SIZE <= end; g++) {
        const asset = view.getUint16(pos, true)
        const instances = view.getUint16(pos + 2, true)
        cell.groups.push({ asset, count: instances })
        cell.count += instances
        pos += GROUP_HEADER_SIZE + instances * VEGETATION_INSTANCE_SIZE
      }
      count += cell.count
      cells.push(cell)
      cellByIndex.set(index, cell)
    }
    start = end
  }

  return {
    tileSize,
    regionSize,
    cellsPerAxis,
    maxInstancesPerCell,
    count,
    cells,
    cellByIndex,
    bytes: new Uint8Array(buffer),
  }
}

/**
 * Repacks the instances of a cell for the GPU, 4 words per instance:
 *
 * - x: packed rotation (as in the file)
 * - y: local x | local y << 16
 * - z: height | scale << 16
 * - w: asset index
 *
 * Returns the number of written instances
 */
export function writeVegetationCell(file: VegetationFile, cell: VegetationCell, out: Uint32Array, offset: number) {
  const view = new DataView(file.bytes.buffer, file.bytes.byteOffset, file.bytes.byteLength)
  let pos = cell.start + 2
  let written = 0
  for (const group of cell.groups) {
    pos += GROUP_HEADER_SIZE
    for (let i = 0; i < group.count; i++, pos += VEGETATION_INSTANCE_SIZE) {
      const o = offset + written * VEGETATION_INSTANCE_WORDS
      out[o + 0] = view.getUint32(pos, true)
      out[o + 1] = view.getUint32(pos + 4, true)
      out[o + 2] = view.getUint16(pos + 8, true) | (view.getUint8(pos + 10) << 16)
      out[o + 3] = group.asset
      written++
    }
  }
  return written
}
