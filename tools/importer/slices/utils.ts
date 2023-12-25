import { readJSONFile, replaceExtname } from "../../../tools/utils"
import { SliceComponent, isAZ__Entity, isSliceComponent } from "./types/dynamicslice"
import * as path from 'path'
import * as fs from 'fs'
import { isAliasAsset } from "./types/aliasasset"

const cache = new Map<string, Promise<any>>()

export async function cached<T>(key: string, task: (key: string) => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    cache.set(key, task(key))
  } else {
    // console.log('cache hit', key)
  }
  return cache.get(key)
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

export async function resolveDynamicSliceFile(rootDir: string, file: string)  {
  if (!file) {
    return null
  }
  let result = await resolveFile(rootDir, file)
  if (!result) {
    result = await resolveFile(path.join(rootDir, 'slices') , file)
  }
  // if (!result && file.includes('/')) {
  //   console.warn(`could not resolve to dynamic slice: ${file}`)
  // }
  return result
}

async function resolveFile(rootDir: string, file: string) {
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
      for (const tag of alias.tags || []) {
        for (const slice of tag.slices || []) {
          if (slice.slice.hint) {
            return resolveFile(rootDir, slice.slice.hint)
          }
        }
      }
      break
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
    if (isAZ__Entity(entity) && (entity as any).id === id || entity.id?.id === id) {
      return entity
    }
  }
  return null
}
