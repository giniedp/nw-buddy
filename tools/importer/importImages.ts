import * as path from 'path'
import * as fs from 'fs'
import { mkdir, processArrayWithProgress, renameExtname, spawn } from '../utils'
import { DatatableSource, walkStringProperties } from './loadDatatables'

export async function importImages(
  {
    input,
    output,
    tables,
    ignoreKeys,
  }: {
    input: string,
    output: string,
    tables: DatatableSource[],
    ignoreKeys: string[] }
) {
  const images = scanImages(tables, {
    ignoreKeys: ignoreKeys
  })
  const missing = new Set<string>()
  await processArrayWithProgress(Array.from(images), async ([source, target]) => {
    source = path.join(input, source)
    target = path.join(input, target)
    if (!fs.existsSync(source)) {
      missing.add(source)
      return
    }

    const outFile = path.join(output, path.relative(path.join(input, 'lyshineui', 'images'), target))
    if (fs.existsSync(outFile)) {
      return
    }
    const outDir = path.dirname(outFile)
    await mkdir(outDir, { recursive: true })
    await spawn(`magick convert "${source}" -quality 85 "${outFile}"`, {
      shell: true,
      stdio: 'pipe',
      env: process.env,
      cwd: process.cwd(),
    }).catch(console.error)
  })
}

function scanImages(tables: DatatableSource[], options?: { ignoreKeys: string[] }) {
  const images = new Map<string, string>()
  const ignore = new Set<string>(options?.ignoreKeys || [])
  walkStringProperties(tables, (key, value, obj) => {
    if (!value.match(/^lyshineui/gi) || ignore.has(key)) {
      return
    }
    const source = path.normalize(value.toLowerCase())
    const sourcePNG = renameExtname(source, '.png').replace(/\\/gi, '/')
    const targetWEBP = renameExtname(source, '.webp').replace(/\\/gi, '/')
    obj[key] = targetWEBP
    images.set(sourcePNG, targetWEBP)
  })
  return images
}
