import { groupBy } from 'lodash'
import path from 'node:path'
import sharp from 'sharp'
import {
  RegionHeightmap,
  TerrainHeightmap,
  downsampleTerrain,
  readRegionHeightmap,
  terrainHeightmap,
  terrainToArray,
} from '../file-formats/heightmap'
import { glob, mkdir, withProgressBar } from '../utils'

export async function processHeightmaps({ inputDir }: { inputDir: string }) {
  const levels = await glob(path.join(inputDir, '**', 'newworld_vitaeeterna', '**', '*.heightmap.png'))
    .then((list) => list.map(resolveHeightmapInfo))
    .then((list) => groupBy(list, 'level'))

  await withProgressBar({ label: 'Heightmaps', tasks: Object.entries(levels) }, async ([level, list], i, log) => {
    const levelDir = path.join('tmp', 'levels', level)
    const regions: RegionHeightmap[] = []
    for (const it of list) {
      log(`${level} read ${it.heightmap}`)
      const region = await readRegionHeightmap(it.heightmap)
      regions.push(region)
    }

    const heightmap = terrainHeightmap(regions)
    const mipLevels: TerrainHeightmap[] = [heightmap]
    const tileSize = 256

    let current = heightmap
    while (current.width > tileSize) {
      log(`${level} downsample ${mipLevels.length} ${current.width} -> ${current.width / 2}`)
      current = downsampleTerrain(current)
      mipLevels.push(current)
    }

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

export async function processHeightmapsOld({ inputDir }: { inputDir: string }) {
  const levels = await glob(path.join(inputDir, '**', 'newworld_vitaeeterna', '**', '*.heightmap.png'))
    .then((list) => list.map(resolveHeightmapInfo))
    .then((list) => groupBy(list, 'level'))

  await withProgressBar({ label: 'Heightmaps', tasks: Object.entries(levels) }, async ([level, list], i, log) => {
    log(`${level} merge regions`)
    const levelDir = path.join('tmp', 'levels', level)

    await mkdir(levelDir, { recursive: true })
    const merged = await mergeRegions(list)
    if (merged?.heightmap) {
      //merged.heightmap.extractChannel(0).raw().toBuffer()

      await merged.heightmap.png().toFile(path.join(levelDir, `heightmap.png`))
    }
    if (merged?.tractmap) {
      await merged?.tractmap.toFile(path.join(levelDir, `tractmap.png`))
    }

    if (merged?.heightmap) {
      await sharp(await merged.heightmap.png().toBuffer(), {
        limitInputPixels: false,
      })
        .png()
        .tile({
          layout: 'dz',
          size: 256,
          depth: 'onetile',
          skipBlanks: 0,
        })
        .toFile(path.join(levelDir, `heightmap`))
    }

    if (merged?.tractmap) {
      await sharp(await merged.tractmap.png().toBuffer(), {
        limitInputPixels: false,
      })
        .png()
        .tile({
          layout: 'dz',
          size: 128,
          depth: 'onetile',
          skipBlanks: 0,
        })
        .toFile(path.join(levelDir, `tractmap`))
    }
  })
}

interface HeightmapInfo {
  level: string
  heightmap: string
  tractmap: string
  regionX: number
  regionY: number
}

function resolveHeightmapInfo(heightmapFile: string): HeightmapInfo {
  const dirname = path.dirname(heightmapFile)
  const tractmapFile = path.join(dirname, 'region.tractmap.png')
  const regionMatch = path.basename(dirname).match(/r_\+(\d+)_\+(\d+)/)
  return {
    level: path.basename(path.dirname(path.dirname(dirname))).toLocaleLowerCase(),
    heightmap: heightmapFile,
    tractmap: tractmapFile,
    regionX: Number(regionMatch[1]),
    regionY: Number(regionMatch[2]),
  }
}

interface MergedRegionsMap {
  heightmap: sharp.Sharp
  tractmap: sharp.Sharp
  regionsX: number
  regionsY: number
  heightmapSize: number
  tractmapSize: number
}

async function mergeRegions(list: HeightmapInfo[]): Promise<MergedRegionsMap | null> {
  const regionsX = 16
  const regionsY = 16
  if (!list.length) {
    return null
  }

  let regionSize = (await sharp(list[0].tractmap).metadata()).width
  const tractmapSize = regionSize * Math.max(regionsX, regionsY)
  const tractmap = sharp({
    limitInputPixels: false,
    create: {
      width: tractmapSize,
      height: tractmapSize,
      channels: 3,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  }).composite(
    await Promise.all(
      list.map(async (it): Promise<sharp.OverlayOptions> => {
        return {
          input: await sharp(it.tractmap).toBuffer(),
          left: it.regionX * regionSize,
          top: (regionsY - it.regionY - 1) * regionSize,
        }
      }),
    ),
  )

  regionSize = (await sharp(list[0].heightmap).metadata()).width
  const heightmapSize = regionSize * Math.max(regionsX, regionsY)
  const heightmapData = new Uint16Array(heightmapSize * heightmapSize)
  for (const it of list) {
    const regionBuffer = await sharp(it.heightmap)
      .toColorspace('grey16')
      .raw({ depth: 'ushort' })
      .extractChannel(0)
      .toBuffer()
    const regionData = new Uint16Array(regionBuffer.buffer, 0, regionBuffer.length / 2)
    const left = it.regionX * regionSize
    const top = (regionsY - it.regionY - 1) * regionSize

    for (let y = 0; y < regionSize; y++) {
      for (let x = 0; x < regionSize; x++) {
        const value = regionData[y * regionSize + x]
        const index = (top + y) * heightmapSize + left + x
        heightmapData[index] = value
      }
    }
  }

  const data = heightmapData
  const rgbHeight = new Uint8Array(data.length * 3)

  for (let i = 0; i < data.length; i++) {
    const value = (data[i] / 0xffff) * 0xffffff
    const r = (value >> 16) & 0xff
    const g = (value >> 8) & 0xff
    const b = value & 0xff
    rgbHeight[i * 3] = r
    rgbHeight[i * 3 + 1] = g
    rgbHeight[i * 3 + 2] = b
  }

  // console.log('')
  // console.log('y')
  // console.log('')
  return {
    tractmap,
    tractmapSize,
    heightmap: sharp(rgbHeight, {
      limitInputPixels: false,
      raw: {
        width: heightmapSize,
        height: heightmapSize,
        channels: 3,
      },
    }).png({
      // compressionLevel: 0,
      // quality: 100,
    }),
    heightmapSize,
    regionsX,
    regionsY,
  }
}
