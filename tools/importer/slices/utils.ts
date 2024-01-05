import * as fs from 'fs'
import * as path from 'path'
import { readJSONFile, replaceExtname } from '../../../tools/utils'
import { isAliasAsset } from './types/aliasasset'
import { SliceComponent, isAZ__Entity, isSliceComponent } from './types/dynamicslice'

const cache: Record<string, Promise<any>> = {}

export async function cached<T>(key: string, task: (key: string) => Promise<T>): Promise<T> {
  if (!cache[key]) {
    cache[key] = task(key)
  } else {
    // console.log('cache hit', key)
  }
  return cache[key]
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

export async function resolveDynamicSliceFile(rootDir: string, file: string): Promise<string> {
  return resolveDynamicSliceFiles(rootDir, file).then((list) => list?.[0] || null)
}

export async function resolveDynamicSliceFiles(rootDir: string, file: string): Promise<string[]> {
  if (!file) {
    return null
  }
  let result = await resolveFile(rootDir, file)
  if (!result) {
    result = await resolveFile(path.join(rootDir, 'slices'), file)
  }
  // if (!result && file.includes('/')) {
  //   console.warn(`could not resolve to dynamic slice: ${file}`)
  // }
  if (!result) {
    return null
  }
  return Array.isArray(result) ? result : [result]
}

async function resolveFile(rootDir: string, file: string): Promise<string | string[]> {
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
  return file
}

export function findAZEntityById(component: SliceComponent, id: number) {
  for (const entity of component.entities || []) {
    if ((isAZ__Entity(entity) && (entity as any).id === id) || entity.id?.id === id) {
      return entity
    }
  }
  return null
}

export function translatePositions(positions: Array<number[]>, translation?: number[]) {
  if (!translation) {
    return positions
  }
  return positions.map(([x, y, z]) => [x + translation[0], y + translation[1], z + translation[2]])
}

export function matrixMapPositions(parent: Array<number[]>, child?: Array<number[]>) {
  const result = []
  for (const [px, py, pz] of parent) {
    if (!child?.length) {
      result.push([px, py, pz])
      continue
    }
    for (const [cx, cy, cz] of child) {
      result.push([px + cx, py + cy, pz + cz])
    }
  }
  return result
}
