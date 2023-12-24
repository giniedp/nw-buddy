import { readJSONFile, replaceExtname } from "../../../tools/utils"
import { SliceComponent, isAZ__Entity, isSliceComponent } from "./types/dynamicslice"
import * as path from 'path'
import * as fs from 'fs'
import { cached } from "./cache"
import { isAliasAsset } from "./types/aliasasset"

export async function readDynamicSliceFile(file: string) {
  const data = await readJSONFile(file)
  if (!isAZ__Entity(data)) {
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

export async function resolveDynamicSliceFile(rootDir: string, file: string) {
  if (!path.isAbsolute(file)) {
    file = path.join(rootDir, file)
  }

  const ext = path.extname(file)
  if (ext === '.json') {
    return resolveDynamicSliceFile(rootDir, replaceExtname(file, ''))
  }

  switch (ext) {
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
            return resolveDynamicSliceFile(rootDir, slice.slice.hint)
          }
        }
      }
      break
    default:
      return null
  }

  if (fs.existsSync(file)) {
    return file
  }
  return null
}

export function findAZEntityById(component: SliceComponent, id: number) {
  for (const entity of component.entities || []) {
    if (isAZ__Entity(entity) && (entity as any).id === id || entity.id?.id === id) {
      return entity
    }
  }
  return null
}
