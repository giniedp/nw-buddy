import { pool } from 'workerpool'
import { Bar, Presets } from 'cli-progress'

function makeBarName(name: string, limit: number = 10) {
  name = name || ''
  if (name) {
    while (name.length < limit) {
      name = ' ' + name
    }
    name = name.substring(0, limit) + ' '
  }
  return name
}

export async function useProgressBar<T>(barName: string, fn: (bar: Bar) => Promise<T>) {
  const bar = new Bar(
    {
      format: `${makeBarName(barName, 10)}{bar} | {percentage}% | {duration_formatted} | {value}/{total} {log}`,
      clearOnComplete: false,
      hideCursor: true,
    },
    Presets.shades_grey
  )

  const result = await fn(bar)
  bar.stop()
  return result
}
export async function withProgressBar<T>(
  {
    barName,
    tasks,
  }: {
    barName?: string
    tasks: T[]
  },
  task: (input: T, index: number, log: (message: string) => void) => Promise<void>
) {
  await useProgressBar(barName, async (bar) => {
    bar.start(tasks.length, 0, { log: '' })
    function log(log: string) {
      bar.update({ log })
    }
    for (let i = 0; i < tasks.length; i++) {
      await task(tasks[i], i, log).catch(console.error)
      bar.update(i + 1)
    }
    log('')
  })
}

export async function withProgressPool<T>(
  {
    barName,
    queue,
    workerScript,
    workerLimit,
    workerType,
  }: {
    barName: string
    queue: TaskQueue,
    workerScript: string
    workerLimit?: number
    workerType?: 'auto' | 'thread' | 'process'
  }
) {
  const tasks = queue.queue
  const taskName = queue.taskName
  const onTaskFinish = queue.onTaskFinish

  if (!tasks?.length) {
    return
  }

  const limit = tasks.length
  let count = 0

  const bar = new Bar(
    {
      format: `${makeBarName(barName, 10)}{bar} | {percentage}% | {duration_formatted} | {value}/{total} {log}`,
      clearOnComplete: false,
      hideCursor: true,
    },
    Presets.shades_grey
  )
  const runner = pool(workerScript, {
    maxWorkers: workerLimit,
    workerType: workerType,
  })

  bar.start(tasks.length, 0, { log: '' })
  return new Promise<void>((resolve) => {
    for (const args of tasks) {
      runner
        .exec(taskName, [args])
        .then(onTaskFinish || (() => null))
        .catch((err) => {
          console.error('\n')
          console.error(err)
        })
        .then(() => {
          count += 1
          bar.increment()
          if (count >= limit) {
            bar.stop()
            runner.terminate()
            resolve()
          }
        })
    }
  })
}

export type TaskRegistry = Record<string, (...args: any[]) => any>
export type TaskName<R extends TaskRegistry> = keyof R
export type TaskInput<R extends TaskRegistry, N extends TaskName<R>> = Parameters<R[N]>[0]
export type TaskOutput<R extends TaskRegistry, N extends TaskName<R>> = ReturnType<R[N]> extends Promise<infer R>
  ? R
  : R[N]

export interface TaskQueue {
  taskName: string,
  queue: Array<any>,
  onTaskFinish?: (arg: any) => Promise<any>,
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
