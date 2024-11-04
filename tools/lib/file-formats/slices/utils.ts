import * as fs from 'fs'
import * as path from 'path'
import { glob, readJSONFile, replaceExtname } from '../../utils'
import { logger } from '../../utils/logger'
import { isAliasAsset } from './types/aliasasset'
import {
  AZ__Entity,
  Asset,
  AssetId,
  SliceComponent,
  isAZ__Entity,
  isGameTransformComponent,
  isSliceComponent,
  isTransformComponent,
} from './types/dynamicslice'
import { z } from 'zod'

const cache: Record<string, Promise<any>> = {}
export async function cached<T>(key: string, task: (key: string) => Promise<T>): Promise<T> {
  if (!cache[key]) {
    cache[key] = task(key)
  } else {
    // console.log('cache hit', key)
  }
  return cache[key]
}

function getAssetCatalog(rootDir: string) {
  return cached('readAssetCatalog', async () => {
    const file = path.join(rootDir, 'assetcatalog.json')
    if (!fs.existsSync(file)) {
      return null
    }
    return readJSONFile<Record<string, string>>(file)
  })
}

function getDatasheet<T>(rootDir: string, file: string) {
  file = file?.toLowerCase()
  return cached(`datasheet:${file}`, async () => {
    const sheetFile = path.join(rootDir, file)
    if (!fs.existsSync(sheetFile)) {
      return null
    }
    return readJSONFile<T>(sheetFile)
  })
}

function parseUUID(uuid: string) {
  if (!uuid) {
    return null
  }
  let result = uuid.toLowerCase().match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)?.[0]
  if (!result) {
    logger.warn('invalid uuid', uuid)
  }
  return normalizeUUID(result)
}

function normalizeUUID(uuid: string) {
  return uuid ? uuid.replace(/-/g, '').toLowerCase() : null
}

export async function readDynamicSliceFile(file: string) {
  if (!file) {
    return null
  }
  const data = await readJSONFile(file)
  if (!isAZ__Entity(data)) {
    console.log('not an entity', file)
    return null
  }
  for (const component of data.components || []) {
    if (isSliceComponent(component)) {
      return component
    }
  }
  return null
}

export async function readAliasFile(file: string) {
  const data = await readJSONFile(file)
  if (!isAliasAsset(data)) {
    return null
  }
  return data
}

export async function resolveDynamicSliceFile(rootDir: string, file: string, assetId?: string): Promise<string> {
  return resolveDynamicSliceFiles(rootDir, file, assetId).then((list) => list?.[0] || null)
}

export async function resolveDynamicSliceFiles(rootDir: string, file: string, assetId?: string): Promise<string[]> {
  return cached(`resolveDynamicSliceFiles ${file} ${assetId}`, async () => {
    if (!file || file === '<PLOT>') {
      return null
    }

    let result = await resolveFile(rootDir, file)
    if (!result && assetId) {
      const catalog = await getAssetCatalog(rootDir)
      result = await resolveFile(rootDir, catalog[parseUUID(assetId)])
    }
    if (!result) {
      result = await resolveFile(path.join(rootDir, 'slices'), file)
    }
    if (!result) {
      const candidates = await glob(path.join(rootDir, 'slices', '**', `${file}.dynamicslice.json`))
      if (candidates.length === 1) {
        result = candidates
      }
    }
    // if (!result && assetId) {
    //   fs.appendFileSync(path.join('tmp', 'missing-asset.txt'), `${cleanUUID(assetId)} ${file}\n`)
    // }
    if (!result) {
      return null
    }
    return Array.isArray(result) ? result : [result]
  })
}

export async function lookupAssetPath(rootDir: string, asset: Asset | AssetId) {
  if (!asset) {
    return null
  }
  const catalog = await getAssetCatalog(rootDir)
  return catalog[parseUUID(asset.guid)] || (asset as Asset).hint
}

export async function resolveAssetFile(rootDir: string, asset: Asset | AssetId) {
  const path = await lookupAssetPath(rootDir, asset)
  return await resolveFile(rootDir, path)
}

async function resolveFile(rootDir: string, file: string): Promise<string[]> {
  if (!file) {
    return null
  }
  if (!path.isAbsolute(file) && rootDir) {
    file = path.join(rootDir, file)
  }

  const ext = path.extname(file)
  switch (ext) {
    case '':
      return resolveFile(rootDir, file + '.dynamicslice')
    case '.json':
      return resolveFile(rootDir, replaceExtname(file, ''))
    case '.dynamicslice':
      file = file + '.json'
      break
    case '.vshapec':
      file = file + '.json'
      break
    case '.slice':
      file = replaceExtname(file, '.dynamicslice.json')
      break
    case '.aliasasset':
      file = file + '.json'
      if (!fs.existsSync(file)) {
        return null
      }
      const alias = await readAliasFile(file)
      return Promise.all(
        (alias.tags || [])
          .map((tag) => tag.slices?.map((slice) => slice.slice.hint) || [])
          .flat()
          .filter((it) => !!it)
          .map((it) => resolveFile(rootDir, it)),
      ).then((list) => list.flat())
    default:
      return null
  }

  if (!fs.existsSync(file)) {
    if (path.basename(file) === 'winterconv_activity_lostpresent_rare_01.dynamicslice.json') {
      file = path.join(path.dirname(file), 'winterconv_activity_lostpresent_rare_00.dynamicslice.json')
    }
  }

  if (!fs.existsSync(file)) {
    // console.warn(`File not found: ${file}`)
    return null
  }
  return [file]
}

const ammoSheetSchema = z.object({
  rows: z.array(
    z.object({
      AmmoID: z.string(),
      AmmoPrefabPath: z.string(),
    }),
  ),
})
export async function resolveAmmoId(rootDir: string, ammoId: string) {
  if (!ammoId) {
    return null
  }
  ammoId = ammoId.toLowerCase()
  const rows = await getDatasheet(
    rootDir,
    'sharedassets/springboardentitites/datatables/javelindata_itemdefinitions_ammo.json',
  )
    .then((it) => ammoSheetSchema.parse(it).rows)
    .catch((err) => {
      console.error(err.message)
      return []
    })

  for (const row of rows) {
    if (row.AmmoID && row.AmmoID.toLowerCase() === ammoId) {
      return row
    }
  }
  return null
}

export function getEntityById(slice: SliceComponent, id: number) {
  for (const entity of slice.entities || []) {
    if (isAZ__Entity(entity) && entity.id === id) {
      return entity
    }
  }
  return null
}

export function getComponentChildren(slice: SliceComponent, componentID: number) {
  const result: AZ__Entity[] = []
  for (const entity of slice.entities || []) {
    for (const component of entity.components) {
      if (isTransformComponent(component)) {
        if (component.parent === componentID) {
          result.push(entity)
        }
        break
      }
      if (isGameTransformComponent(component)) {
        if (component.m_parentid === componentID) {
          result.push(entity)
        }
        break
      }
    }
  }
  return result
}

export function getComponentTransforms(component: AZ__Entity['components'][0]): {
  translation: number[]
  rotation: number[][]
} {
  let translation: number[]
  let rotation: number[]
  if (isGameTransformComponent(component)) {
    if (component.m_worldtm) {
      translation = component.m_worldtm.__value?.translation
      rotation = component.m_worldtm.__value?.['rotation/scale']
    } else if (component.m_localtm) {
      translation = component.m_localtm.__value?.translation
      rotation = component.m_localtm.__value?.['rotation/scale']
    }
  }
  if (isTransformComponent(component)) {
    translation = component.transform.__value?.translation
    rotation = component.transform.__value?.['rotation/scale']
  }
  if (translation && rotation) {
    return {
      translation: getTranslation(translation),
      rotation: getRotation(rotation),
    }
  }
  return null
}

function getTranslation(value?: number[]) {
  if (Array.isArray(value)) {
    return [...value]
  }
  return null
}

function getRotation(value?: number[]) {
  let result: number[][] = null
  if (value && Array.isArray(value) && value.length === 9) {
    const [x1, y1, z1, x2, y2, z2, x3, y3, z3] = value
    result = [
      [x1, y1, z1],
      [x2, y2, z2],
      [x3, y3, z3],
    ]
  }
  if (!Array.isArray(result)) {
    return null
  }
  if (result.length !== 3) {
    return null
  }
  for (const row of result) {
    if (!Array.isArray(row) || row.length !== 3) {
      return null
    }
  }
  // skip if it is an identity matrix
  if (
    result[0][0] === 1 &&
    result[0][1] === 0 &&
    result[0][2] === 0 &&
    result[1][0] === 0 &&
    result[1][1] === 1 &&
    result[1][2] === 0 &&
    result[2][0] === 0 &&
    result[2][1] === 0 &&
    result[2][2] === 1
  ) {
    return null
  }
  return result
}

const boundarySchema = z.object({
  vertices: z.array(z.array(z.number())),
})

export async function resolveBoundaryShape(rootDir: string, asset: Asset | AssetId) {
  const assetFiles = await resolveAssetFile(rootDir, asset)
  let file: string = null
  if (typeof assetFiles === 'string') {
    file = assetFiles
  } else if (Array.isArray(assetFiles)) {
    file = assetFiles[0]
  }
  if (!file) {
    return null
  }
  const data = await readJSONFile(file, boundarySchema)
  return data?.vertices
}

export function translatePoints(points: Array<number[]>, translation?: number[]) {
  if (!translation) {
    return points
  }
  return points.map(([x, y, z]) => {
    return [x + translation[0], y + translation[1], (z ?? 0) + (translation[2] ?? 0)]
  })
}

export function rotatePoints(points: Array<number[]>, mRot3x3?: number[][]) {
  if (!points?.length || !mRot3x3?.length) {
    return points
  }
  return points.map(([x, y, z]) => {
    z ??= 0
    return [
      x * mRot3x3[0][0] + y * mRot3x3[1][0] + z * mRot3x3[2][0],
      x * mRot3x3[0][1] + y * mRot3x3[1][1] + z * mRot3x3[2][1],
      x * mRot3x3[0][2] + y * mRot3x3[1][2] + z * mRot3x3[2][2],
    ]
  })
}

export function isPointInAABB(point: number[], min: number[], max: number[]) {
  const x = point[0]
  const y = point[1]
  if (x < min[0] || x > max[0] || y < min[1] || y > max[1]) {
    return false
  }
  return true
}

export function isPointInPolygon(point: number[], vs: number[][]) {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

  const x = point[0]
  const y = point[1]

  let inside = false
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0]
    const yi = vs[i][1]
    const xj = vs[j][0]
    const yj = vs[j][1]

    var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) {
      inside = !inside
    }
  }

  return inside
}
