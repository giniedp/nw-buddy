import * as path from 'path'
import { readJSONFile } from '../../../tools/utils/file-utils'

export async function* readLocaleFile(files: string | string[]) {
  files = Array.isArray(files) ? files : [files]
  for (const file of files) {
    const json = await readJSONFile<Record<string, { value: string }>>(file)
    const lang = path.basename(path.dirname(file))
    for (const key in json) {
      yield { lang, key, value: json[key]['value'] }
    }
  }
}

export function normalizeLocaleKey(key: string) {
  key = key || ''
  if (key.startsWith('@')) {
    key = key.substring(1)
  }
  return key.toLowerCase()
}
