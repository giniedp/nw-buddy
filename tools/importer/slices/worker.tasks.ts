import { scanSlices } from './scan-slices.task'
export const WORKER_TASKS = {
  scanSlices
} as const

export type Tasks = typeof WORKER_TASKS
export type TaskName = keyof Tasks
export type TaskArgs<T extends TaskName> = Parameters<Tasks[T]>[0]
export type TaskResult<T extends TaskName> = ReturnType<Tasks[T]> extends Promise<infer R> ? R : never

export function workerTasks<K extends TaskName>(taskName: K, tasks: Array<TaskArgs<K>>) {
  return {
    taskName,
    tasks
  }
}
