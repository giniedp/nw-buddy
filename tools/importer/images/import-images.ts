import * as path from 'path'
<<<<<<< HEAD
import {
  assmebleWorkerTasks,
  replaceExtname,
  withProgressBar,
  withProgressPool as withProgressWorker,
} from '../../utils'
=======
import { assmebleWorkerTasks, replaceExtname, withProgressBar, withProgressPool as withProgressWorker } from '../../utils'
>>>>>>> ptr

import { walkJsonStrings } from '../../utils/walk-json-object'
import { WORKER_TASKS } from './worker.tasks'

export type RewriteImageEntryFn = (key: string, value: string, obj: any) => string | null
export async function importImages({
  input,
  output,
  update,
  tables,
  ignoreKeys,
  rewrite,
  rewritePath,
  threads,
}: {
  input: string
  output: string
  update: boolean
  tables: Object[]
  ignoreKeys: string[]
  rewrite?: Record<string, RewriteImageEntryFn>
<<<<<<< HEAD
  rewritePath?: (value: string) => string
=======
  rewritePath?: (value: string) => string,
>>>>>>> ptr
  threads: number
}) {
  const images = new Map<string, string>()

  await withProgressBar({ barName: 'Scan', tasks: tables }, async (table, _, log) => {
    // log(table.relative)
    scanImages([table], {
      ignoreKeys: ignoreKeys,
      rewrite: rewrite,
      rewritePath: rewritePath,
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

function scanImages(
  tables: Object | Object[],
  options?: {
    ignoreKeys: string[]
    rewrite?: Record<string, RewriteImageEntryFn>
    rewritePath?: (value: string) => string
    images?: Map<string, string>
  }
) {
  const images = options.images || new Map<string, string>()
  const ignore = new Set<string>(options?.ignoreKeys || [])
  walkJsonStrings(tables, (key, value, obj) => {
    value = options?.rewrite?.[key]?.(key, value, obj) ?? value
    if (!value.match(/^lyshineui/gi) || ignore.has(key)) {
      return
    }
    const source = path.normalize(value.toLowerCase())
    const sourcePNG =
      replaceExtname(source, '.png')
        .toLowerCase()
        .replace(/\\/g, '/')
        // removes space before extension
        //   - "lyshineui/images/icons/items/weapon/1hthrowingaxelostt2 .png"
        .replace(/\s+\.png$/, '.png')

        if (sourcePNG.includes(' ')) {
          console.error(new Error(`XXX "${sourcePNG}"`))
        }
    const targetWEBP = replaceExtname(source, '.webp')
      .toLowerCase()
      .replace(/\\/g, '/')
      .replace(/^\/?lyshineui\/images/, '')
      .replace(/\s+\.webp$/, '.webp')
    obj[key] = options?.rewritePath ? options?.rewritePath(targetWEBP) : targetWEBP
    images.set(sourcePNG, targetWEBP)
  })
  return images
}
