import { signalStore, withState } from '@ngrx/signals'
import { ObjectiveTasks } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'

export interface QuestTaskDetailState {
  taskId: string
  task: ObjectiveTasks
  children: TaskTree[]
}

export interface TaskTree {
  task: ObjectiveTasks
  children: TaskTree[]
}

export const QuestTaskDetailStore = signalStore(
  withState<QuestTaskDetailState>({
    taskId: null,
    task: null,
    children: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      async load(taskId: string) {
        const tasksMap = await db.objectiveTasksByIdMap()
        const tree = selectTree(taskId, tasksMap)
        return {
          taskId,
          task: tree?.task,
          children: tree?.children,
        }
      },
    }
  }),
)

function selectTree(taskId: string, data: Map<string, ObjectiveTasks>): TaskTree {
  const task = data?.get(taskId)
  const children = selectSubTaskIds(task)
    .map((subTaskId) => selectTree(subTaskId, data))
    .filter((it) => it.task || it.children.length)
  return {
    task,
    children,
  }
}

function selectSubTaskIds(task: ObjectiveTasks) {
  const result: string[] = []
  if (!task) {
    return result
  }
  for (const key of Object.keys(task)) {
    if (key.startsWith('SubTask') && task[key]) {
      result.push(task[key])
    }
  }
  return result
}
