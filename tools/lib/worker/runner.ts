import path from 'node:path'
import { logger } from '../utils/logger'
import { withProgressBar, withProgressPool } from '../utils/progress'
import { TaskArgs, TaskName, TaskResult, WORKER_TASKS } from './tasks'

export interface RunTasksOptions<K extends TaskName> {
  label?: string
  threads?: number
  taskName: K
  tasks: Array<TaskArgs<K>>
  onTaskFinish?: (arg: TaskResult<K>) => Promise<any>
}

export async function runTasks<K extends TaskName>(options: RunTasksOptions<K>) {
  if (!options.threads || options.threads <= 1) {
    return runSerial(options)
  }
  return withProgressPool({
    barName: options.label,
    workerScript: path.join(__dirname, 'worker.js'),
    workerLimit: options.threads,
    workerType: 'thread',
    queue: {
      queue: options.tasks,
      taskName: options.taskName,
      onTaskFinish: options.onTaskFinish,
    },
  })
}

async function runSerial<K extends TaskName>({ label, taskName, tasks }: RunTasksOptions<K>) {
  await withProgressBar({ label, tasks }, async (args) => {
    await WORKER_TASKS[taskName](args as any).catch((err) => logger.error(err))
  })
}
