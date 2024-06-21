import { Bar, MultiBar, Presets } from 'cli-progress'
import { pool } from 'workerpool'
import { logger } from './logger'

function barLabel(label: string, size: number = 10) {
  return (label || '').padStart(size - 1, ' ').substring(0, size) + ' '
}

let multiBar: MultiBar
export async function useProgressBar<T>(
  labelOrOptions:
    | string
    | {
        label?: string
        autoremove?: boolean
      },
  task: (bar: Bar) => Promise<T>,
) {
  const isRoot = !multiBar
  const label = typeof labelOrOptions === 'string' ? labelOrOptions : labelOrOptions?.label
  const autoremove = typeof labelOrOptions === 'object' ? labelOrOptions.autoremove : false
  if (!multiBar) {
    const bars = new MultiBar(
      {
        format: `${barLabel(label, 20)}{bar} | {value}/{total} {percentage}% | {duration_formatted} ETA:{eta_formatted} {log}`,
        clearOnComplete: false,
        hideCursor: true,
        etaBuffer: 1000,
        forceRedraw: true,
        linewrap: true,
        fps: 60,
      },
      Presets.shades_grey,
    )
    logger.redirect((...msg) => {
      bars.log(msg.join(' ') + '\n')
      bars.update()
    })
    multiBar = bars
  }

  const bar = multiBar.create(100, 0)
  bar.update({ log: '' })
  const result = await task(bar)
  bar.stop()
  if (autoremove) {
    multiBar.remove(bar)
  }
  if (isRoot) {
    multiBar.stop()
    logger.redirect(null)
    multiBar = null
  }
  return result
}

export async function withProgressBar<T>(
  {
    label,
    tasks,
  }: {
    label?: string
    tasks: T[]
  },
  task: (input: T, index: number, log: (message: string) => void) => Promise<void>,
) {
  await useProgressBar(label, async (bar) => {
    bar.start(tasks.length, 0, { log: '' })
    function log(log: string) {
      bar.update({ log })
      bar.render()
    }
    for (let i = 0; i < tasks.length; i++) {
      await task(tasks[i], i, log).catch(logger.error)
      bar.update(i + 1)
      bar.render()
    }
    log('')
  })
}

export async function withProgressPool<T>({
  barName,
  queue,
  workerScript,
  workerLimit,
  workerType,
}: {
  barName: string
  queue: TaskQueue
  workerScript: string
  workerLimit?: number
  workerType?: 'auto' | 'thread' | 'process'
}) {
  const tasks = queue.queue
  const taskName = queue.taskName
  const onTaskFinish = queue.onTaskFinish

  if (!tasks?.length) {
    return
  }
  const runner = pool(workerScript, {
    maxWorkers: workerLimit,
    workerType: workerType,
  })
  function execute(bar?: Bar) {
    let count = 0
    return new Promise<void>((resolve) => {
      bar?.start(tasks.length, 0, { log: '' })
      for (const args of tasks) {
        runner
          .exec(taskName, [args])
          .then(onTaskFinish || (() => null))
          .catch((err) => {
            logger.error(err)
          })
          .then(() => {
            count += 1
            bar?.increment()
            if (count >= tasks.length) {
              bar?.stop()
              runner.terminate()
              resolve()
            }
          })
      }
    })
  }

  await useProgressBar(barName, execute)
}

export type TaskRegistry = Record<string, (...args: any[]) => any>
export type TaskName<R extends TaskRegistry> = keyof R
export type TaskInput<R extends TaskRegistry, N extends TaskName<R>> = Parameters<R[N]>[0]
export type TaskOutput<R extends TaskRegistry, N extends TaskName<R>> =
  ReturnType<R[N]> extends Promise<infer R> ? R : R[N]

export interface TaskQueue {
  taskName: string
  queue: Array<any>
  onTaskFinish?: (arg: any) => Promise<any>
}

export function assmebleWorkerTasks<R extends TaskRegistry, N extends TaskName<R>>({
  taskName,
  tasks,
  onTaskFinish,
}: {
  registry: R
  taskName: N
  tasks: Array<TaskInput<R, N>>
  onTaskFinish?: (res: TaskOutput<R, N>) => Promise<any>
}): TaskQueue {
  return {
    taskName: taskName as string,
    queue: tasks,
    onTaskFinish,
  }
}
