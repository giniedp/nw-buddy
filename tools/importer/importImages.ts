import * as path from 'path'
import * as fs from 'fs'
import { mkdir, processArrayWithProgress, renameExtname, spawn } from '../utils'
import { DataTableSource, walkStringProperties } from './loadDatatables'

export type ReqriteEntryFn = (key: string, value: string, obj: any) => string | null
export async function importImages({
  input,
  output,
  tables,
  ignoreKeys,
  rewrite,
  rewritePath,
}: {
  input: string
  output: string
  tables: DataTableSource[]
  ignoreKeys: string[]
  rewrite?: Record<string, ReqriteEntryFn>
  rewritePath?: (value: string) => string
}) {
  const images = scanImages(tables, {
    ignoreKeys: ignoreKeys,
    rewrite: rewrite,
    rewritePath: rewritePath,
  })
  const missing = new Set<string>()
  await processArrayWithProgress(Array.from(images), async ([source, target]) => {
    source = path.join(input, source)
    if (!fs.existsSync(source)) {
      missing.add(source)
      return
    }

    const outFile = path.join(output, target)
    if (fs.existsSync(outFile)) {
      return
    }
    const outDir = path.dirname(outFile)
    await mkdir(outDir, { recursive: true })
    await spawn(`convert "${source}" -quality 85 "${outFile}"`, {
      shell: true,
      stdio: 'pipe',
      env: process.env,
      cwd: process.cwd(),
    }).catch(console.error)
  })
}

function scanImages(
  tables: DataTableSource[],
  options?: {
    ignoreKeys: string[];
    rewrite?: Record<string, ReqriteEntryFn>
    rewritePath?: (value: string) => string
  }
) {
  const images = new Map<string, string>()
  const ignore = new Set<string>(options?.ignoreKeys || [])
  walkStringProperties(tables, (key, value, obj) => {
    value = options?.rewrite?.[key]?.(key, value, obj) ?? value
    if (!value.match(/^lyshineui/gi) || ignore.has(key)) {
      return
    }
    const source = path.normalize(value.toLowerCase())
    const sourcePNG = renameExtname(source, '.png').toLowerCase().replace(/\\/g, '/')
    const targetWEBP = renameExtname(source, '.webp')
      .toLowerCase()
      .replace(/\\/g, '/')
      .replace(/^\/?lyshineui\/images/, '')
    obj[key] = options?.rewritePath ? options?.rewritePath(targetWEBP) : targetWEBP
    images.set(sourcePNG, targetWEBP)
  })
  return images
}
