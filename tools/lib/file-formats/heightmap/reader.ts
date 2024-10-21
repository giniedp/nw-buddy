import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import type { RegionHeightmap } from './utils'

export async function readRegionHeightmap(file: string): Promise<RegionHeightmap> {
  const meta = getHeightmapMeta(file)
  const data = await getHeightmapData(file)
  return {
    ...meta,
    data: Array.from(data),
  }
}

export async function getHeightmapData(heightmapFile: string) {
  const regionBuffer = await sharp(heightmapFile)
    .toColorspace('grey16')
    .raw({ depth: 'ushort' })
    .extractChannel(0)
    .toBuffer()
  return new Uint16Array(regionBuffer.buffer, 0, regionBuffer.length / 2)
}

export function getHeightmapMeta(heightmapFile: string) {
  const dirname = path.dirname(heightmapFile)
  const regionMatch = path.basename(dirname).match(/r_\+(\d+)_\+(\d+)/)
  const levelName = path.basename(path.dirname(path.dirname(dirname))).toLocaleLowerCase()
  const settingsFile = path.join(dirname, 'mapsettings.json')
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) as { regionSize: number }
  return {
    level: levelName,
    heightmap: heightmapFile,
    regionX: Number(regionMatch[1]),
    regionY: Number(regionMatch[2]),
    regionSize: settings.regionSize,
  }
}
