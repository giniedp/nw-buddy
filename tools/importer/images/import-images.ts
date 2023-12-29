import * as path from 'path'
import {
  assmebleWorkerTasks,
  replaceExtname,
  withProgressBar,
  withProgressPool as withProgressWorker,
} from '../../utils'

import { walkJsonStrings } from '../../utils/walk-json-object'
import { WORKER_TASKS } from './worker.tasks'

export type RewriteImageEntryFn = (key: string, value: string, obj: any) => string | null
export async function importImages({
  input,
  output,
  update,
  tables,
  shouldIgnore,
  rewrite,
  rewritePath,
  threads,
  staticImages,
}: {
  input: string
  output: string
  update: boolean
  tables: Object[]
  shouldIgnore?: (key: string, imgPath: string, obj: Object) => boolean
  rewrite?: Record<string, RewriteImageEntryFn>
  rewritePath?: (value: string) => string
  threads: number
  staticImages: string[]
}) {
  const images = new Map<string, string>()

  await withProgressBar({ barName: 'Scan', tasks: tables }, async (table, _, log) => {
    // log(table.relative)
    scanTablesForImages([table], {
      shouldIgnore: shouldIgnore,
      rewrite: rewrite,
      rewritePath: rewritePath,
      images: images,
    })
    addStaticImages(staticImages, {
      shouldIgnore: shouldIgnore,
      images: images,
    })
  })

  await withProgressWorker({
    barName: 'Convert',
    workerScript: path.resolve(__dirname, 'worker.js'),
    workerType: 'thread',
    workerLimit: threads,
    queue: assmebleWorkerTasks({
      registry: WORKER_TASKS,
      taskName: 'importImage',
      tasks: Array.from(images).map(([source, target]) => {
        return {
          input: path.join(input, source),
          output: path.join(output, target),
          update,
        }
      }),
    }),
  })
}

function addStaticImages(
  files: string[],
  options?: {
    shouldIgnore?: (key: string, imgPath: string, obj: Object) => boolean
    images?: Map<string, string>
  }
) {
  const images = options.images || new Map<string, string>()
  for (let value of files) {
    if (!value.match(/^lyshineui/gi)) {
      return
    }
    if (!path.extname(value)) {
      value += '.png'
    }
    const { source, target } = selectImage(value)
    images.set(source, target)
  }
  return images
}

function scanTablesForImages(
  tables: Object | Object[],
  options?: {
    shouldIgnore?: (key: string, imgPath: string, obj: Object) => boolean
    rewrite?: Record<string, RewriteImageEntryFn>
    rewritePath?: (value: string) => string
    images?: Map<string, string>
  }
) {
  const images = options.images || new Map<string, string>()
  const shouldIgnore = options?.shouldIgnore
  walkJsonStrings(tables, (key, value, obj) => {
    value = options?.rewrite?.[key]?.(key, value, obj) ?? value
    if (!value.match(/^lyshineui/gi) || shouldIgnore?.(key, value, obj)) {
      return
    }
    const { source, target } = selectImage(value)
    obj[key] = options?.rewritePath ? options?.rewritePath(target) : target
    images.set(source, target)
  })
  return images
}

function selectImage(image: string) {
  const source = path.normalize(image.toLowerCase())
  const sourcePNG = replaceExtname(source, '.png')
    .toLowerCase()
    .replace(/\\/g, '/')
    // removes space before extension
    //   - "lyshineui/images/icons/items/weapon/1hthrowingaxelostt2 .png"
    .replace(/\s+\.png$/, '.png')
  const targetWEBP = replaceExtname(source, '.webp')
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/^\/?lyshineui\/images/, '')
    .replace(/\s+\.webp$/, '.webp')
  return {
    source: sourcePNG,
    target: targetWEBP,
  }
}
