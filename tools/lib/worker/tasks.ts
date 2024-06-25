import { scanSlices } from '../file-formats/slices/scan-slices'
import { readPakIndex } from '../file-system/pak-index.task'
import { convertDdsToPng } from './convert-dds-to-png'
import { convertPngToWebp } from './convert-png-to-webp'

export const WORKER_TASKS = {
  convertDdsToPng,
  convertPngToWebp,
  scanSlices,
  readPakIndex,
} as const

export type WorkerTasks = typeof WORKER_TASKS
export type TaskName = keyof WorkerTasks
export type TaskArgs<T extends TaskName> = Parameters<WorkerTasks[T]>[0]
export type TaskResult<T extends TaskName> = Awaited<ReturnType<WorkerTasks[T]>>
