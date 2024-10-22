export interface RegionHeightmap {
  level: string
  heightmap: string
  data: number[]
  regionX: number
  regionY: number
  regionSize: number
}

export interface TerrainHeightmap {
  regions: RegionHeightmap[][]
  regionsX: number
  regionsY: number
  regionSize: number
  width: number
  height: number
}

export function terrainHeightmap(heightmaps: RegionHeightmap[]): TerrainHeightmap {
  const regionsX = nextPowerOf2(Math.max(...heightmaps.map((r) => r.regionX)) + 1)
  const regionsY = nextPowerOf2(Math.max(...heightmaps.map((r) => r.regionY)) + 1)
  const regionSize = heightmaps[0].regionSize
  const regions: RegionHeightmap[][] = []
  for (const region of heightmaps) {
    if (!regions[region.regionY]) {
      regions[region.regionY] = []
    }
    regions[region.regionY][region.regionX] = region
  }
  return {
    regions,
    regionsX,
    regionsY,
    regionSize,
    width: regionsX * regionSize,
    height: regionsY * regionSize,
  }
}

function nextPowerOf2(value: number) {
  return Math.pow(2, Math.ceil(Math.log2(value)))
}

export function getTerrainHeightAt(heightmap: TerrainHeightmap, x: number, y: number) {
  const regionX = Math.floor(x / heightmap.regionSize)
  const regionY = Math.floor(y / heightmap.regionSize)
  const region = heightmap.regions[regionY]?.[regionX]
  if (region) {
    x = x % heightmap.regionSize
    y = y % heightmap.regionSize
    return getRegionHeightAt(region, x, y)
  }
  return null
  // TODO: clamp to the edge of the terrain
}

export function setTerrainHeightAt(heightmap: TerrainHeightmap, x: number, y: number, value: number) {
  const regionX = Math.floor(x / heightmap.regionSize)
  const regionY = Math.floor(y / heightmap.regionSize)
  const region = heightmap.regions[regionY]?.[regionX]
  if (region) {
    x = x % heightmap.regionSize
    y = y % heightmap.regionSize
    setRegionHeightAt(region, x, y, value)
  }
}

export function getRegionHeightAt(heightmap: RegionHeightmap, x: number, y: number) {
  y = heightmap.regionSize - y - 1
  return heightmap.data[y * heightmap.regionSize + x]
}

export function setRegionHeightAt(heightmap: RegionHeightmap, x: number, y: number, value: number) {
  if (x < 0 || x >= heightmap.regionSize || y < 0 || y >= heightmap.regionSize) {
    throw new Error(`Out of bounds: ${x}, ${y}`)
  }
  y = heightmap.regionSize - y - 1
  heightmap.data[y * heightmap.regionSize + x] = value
}

const samples = [
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
  // [-1, 0, 2],
  // [1, 0, 2],
  // [0, -1, 2],
  // [0, 1, 2],
  // [-1, -1, 1],
  // [1, -1, 1],
  // [-1, 1, 1],
  // [1, 1, 1],
]
function getTerrainSmoothHeightAt(heightmap: TerrainHeightmap, x: number, y: number) {
  let totalWeight = 0
  let totalValue = 0
  for (const [dx, dy, weight] of samples) {
    const value = getTerrainHeightAt(heightmap, x + dx, y + dy)
    if (value != null) {
      totalValue += value * weight
      totalWeight += weight
    }
  }
  if (totalWeight) {
    return totalValue / totalWeight
  }
  return totalValue
}

export function downsampleTerrain(heightmap: TerrainHeightmap, maxRegionSize = 2048) {
  const result: TerrainHeightmap = {
    regions: [],
    regionsX: 0,
    regionsY: 0,
    regionSize: 0,
    width: heightmap.width / 2,
    height: heightmap.height / 2,
  }
  if (result.width >= maxRegionSize) {
    result.regionSize = maxRegionSize
    result.regionsX = Math.ceil(result.width / maxRegionSize)
    result.regionsY = Math.ceil(result.height / maxRegionSize)
  } else {
    result.regionSize = result.width
    result.regionsX = 1
    result.regionsY = 1
  }

  for (let y = 0; y < result.regionsY; y++) {
    result.regions[y] = []
    for (let x = 0; x < result.regionsX; x++) {
      const size = result.regionSize
      const data: number[] = []
      data.length = size * size
      data.fill(0)
      result.regions[y][x] = {
        regionX: x,
        regionY: y,
        regionSize: size,
        heightmap: null,
        level: null,
        data: data,
      }
    }
  }
  let sampleCount = 0
  let sampleTotal = 0
  let sampleMax = 0
  for (let y = 0; y < result.height; y++) {
    for (let x = 0; x < result.width; x++) {
      const sample = getTerrainSmoothHeightAt(heightmap, x * 2, y * 2)
      setTerrainHeightAt(result, x, y, sample)
      sampleMax = Math.max(sampleMax, sample)
      sampleTotal += sample
      sampleCount++
    }
  }

  return result
}

export function terrainToArray(
  heightmap: TerrainHeightmap,
  section?: { x: number; y: number; width: number; height: number },
) {
  if (!section) {
    section = { x: 0, y: 0, width: heightmap.width, height: heightmap.height }
  }
  const result: number[] = []
  result.length = section.width * section.height
  let index = 0
  for (let y = section.y + section.height - 1; y >= section.y; y--) {
    for (let x = section.x; x < section.x + section.width; x++) {
      result[index++] = getTerrainHeightAt(heightmap, x, y) || 0
    }
  }
  return result
}
