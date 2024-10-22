import { groupBy } from 'lodash'
import path from 'node:path'
import sharp from 'sharp'
import {
  RegionHeightmap,
  TerrainHeightmap,
  downsampleTerrain,
  getHeightmapMeta,
  readRegionHeightmap,
  terrainHeightmap,
  terrainToArray,
} from '../file-formats/heightmap'
import { glob, mkdir, withProgressBar } from '../utils'

export async function processHeightmaps({ inputDir }: { inputDir: string }) {
  const levels = await glob(path.join(inputDir, '**', 'newworld_vitaeeterna', '**', '*.heightmap.png'))
    .then((list) => list.map(getHeightmapMeta))
    .then((list) => groupBy(list, (it) => it.level))

  await withProgressBar({ label: 'Heightmaps', tasks: Object.entries(levels) }, async ([level, list], i, log) => {
    const levelDir = path.join('tmp', 'levels', level)

    // read all regions
    const regions: RegionHeightmap[] = []
    for (const it of list) {
      log(`${level} read ${it.heightmap}`)
      const region = await readRegionHeightmap(it.heightmap)
      regions.push(region)
    }

    // downsample heightmap
    const heightmap = terrainHeightmap(regions)
    const mipLevels: TerrainHeightmap[] = [heightmap]
    const tileSize = 256

    let current = heightmap
    while (current.width > tileSize) {
      log(`${level} downsample ${mipLevels.length} ${current.width} -> ${current.width / 2}`)
      current = downsampleTerrain(current)
      mipLevels.push(current)
    }

    // generate tiles
    for (let i = 0; i < mipLevels.length; i++) {
      const mipLevel = i + 1
      const outDir = path.join(levelDir, 'heightmap', `${mipLevel}`)

      const mip = mipLevels[i]
      const step = Math.pow(2, i)
      const tilesX = mip.width / tileSize
      const tilesY = mip.height / tileSize

      await mkdir(outDir, { recursive: true })
      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          log(
            `${level} generate tiles ${mipLevel}/${mipLevels.length} ${String(tx).padStart(3)}/${tilesX} ${String(ty).padStart(3)}/${tilesY}`,
          )
          const values = terrainToArray(mip, {
            x: tx * tileSize,
            y: ty * tileSize,
            width: tileSize,
            height: tileSize,
          })
          const rawData = encodeHeightmap(values)
          const name = `heightmap_l${mipLevel}_y${String(ty * step).padStart(3, '0')}_x${String(tx * step).padStart(3, '0')}`
          await sharp(rawData, {
            limitInputPixels: false,
            raw: {
              width: tileSize,
              height: tileSize,
              channels: 3,
            },
          })
            .png()
            .toFile(path.join(outDir, `${name}.png`))
        }
      }
    }
  })
}

function encodeHeightmap(data: number[]) {
  const rgbHeight = new Uint8Array(data.length * 3)
  for (let i = 0; i < data.length; i++) {
    const value = ((data[i] / 0xff_ff) * 0xff_ff_ff) | 0
    const r = (value >> 16) & 0xff
    const g = (value >> 8) & 0xff
    const b = value & 0xff
    rgbHeight[i * 3] = r
    rgbHeight[i * 3 + 1] = g
    rgbHeight[i * 3 + 2] = b
  }
  return rgbHeight
}
