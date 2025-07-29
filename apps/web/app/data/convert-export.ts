import { recursivelyEncodeArrayBuffers } from './buffer-encoding'
import { PREFERENCES_DB_KEY, SENSITIVE_KEYS } from './constants'
import { ExportedDB } from './db.service'

export async function convertExport({
  database,
  preferences,
  publicExport,
}: {
  database: ExportedDB
  preferences: Record<string, any>
  publicExport: boolean
}) {
  const result = {
    ...preferences,
    [PREFERENCES_DB_KEY]: database,
  }

  await recursivelyEncodeArrayBuffers(result)
  if (publicExport) {
    removeSensitiveKeys(result)
  }
  return result
}

function removeSensitiveKeys(data: any) {
  if (!data) {
    return
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      removeSensitiveKeys(item)
    }
  } else if (typeof data === 'object') {
    for (const key of SENSITIVE_KEYS) {
      if (key in data) {
        console.log('removed key', key, data[key])
        delete data[key]
      }
    }
    for (const key in data) {
      removeSensitiveKeys(data[key])
    }
  }
}
