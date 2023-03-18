import * as path from 'path'
import * as fs from 'fs'
import { mkdir, replaceExtname, spawn, withProgressBar } from '../utils'
import { DataTableSource, walkStringProperties } from './loadDatatables'

export type ReqriteEntryFn = (key: string, value: string, obj: any) => string | null
export async function importImages({
  input,
  output,
  update,
  tables,
  ignoreKeys,
  rewrite,
  rewritePath,
}: {
  input: string
  output: string
  update: boolean
  tables: DataTableSource[]
  ignoreKeys: string[]
  rewrite?: Record<string, ReqriteEntryFn>
  rewritePath?: (value: string) => string
}) {
  const images = new Map<string, string>()

  await withProgressBar({ name: 'Scan', input: tables }, async (table, _, log) => {
    log(table.relative)
    scanImages(tables, {
      ignoreKeys: ignoreKeys,
      rewrite: rewrite,
      rewritePath: rewritePath,
      images: images
    })
  })

  await withProgressBar({ name: 'Convert', input: Array.from(images) }, async ([source, target], _, log) => {
    log(`${source} -> ${target}`)
    source = path.join(input, source)
    if (!fs.existsSync(source)) {
      return
    }
    const outFile = path.join(output, target)
    if (!update && fs.existsSync(outFile)) {
      return
    }
    const outDir = path.dirname(outFile)
    await mkdir(outDir, { recursive: true })
    await spawn(process.env.MAGICK_CONVERT_CMD || 'magick convert', [source, '-quality', '85', outFile], {
      shell: true,
      stdio: 'inherit',
    })
  })
}

function scanImages(
  tables: DataTableSource | DataTableSource[],
  options?: {
    ignoreKeys: string[]
    rewrite?: Record<string, ReqriteEntryFn>
    rewritePath?: (value: string) => string
    images?: Map<string, string>
  }
) {
  const images = options.images || new Map<string, string>()
  const ignore = new Set<string>(options?.ignoreKeys || [])
  walkStringProperties(tables, (key, value, obj) => {
    value = options?.rewrite?.[key]?.(key, value, obj) ?? value
    if (!value.match(/^lyshineui/gi) || ignore.has(key)) {
      return
    }
    const source = path.normalize(value.toLowerCase())
    const sourcePNG = replaceExtname(source, '.png').toLowerCase().replace(/\\/g, '/')
    const targetWEBP = replaceExtname(source, '.webp')
      .toLowerCase()
      .replace(/\\/g, '/')
      .replace(/^\/?lyshineui\/images/, '')
    obj[key] = options?.rewritePath ? options?.rewritePath(targetWEBP) : targetWEBP
    images.set(sourcePNG, targetWEBP)
  })
  return images
}
