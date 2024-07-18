import { computed, effect, inject } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { ObjectiveTasks } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { selectSignal } from '~/utils'

export interface QuestTaskDetailState {
  taskId: string
}

export interface TaskTree {
  task: ObjectiveTasks,
  children: TaskTree[]
}

export const QuestTaskDetailStore = signalStore(
  withState<QuestTaskDetailState>({ taskId: '' }),
  withComputed(({ taskId }) => {
    const db = inject(NwDataService)
    const tree = selectSignal({
      taskId: taskId,
      tasksMap: db.objectiveTasksMap
    }, ({ taskId, tasksMap }) => {
      return selectTree(taskId, tasksMap)
    })

    return {
      task: computed(() => tree().task),
      children: computed(() => tree().children),
    }
  }),
)

function selectTree(taskId: string, data: Map<string, ObjectiveTasks>): TaskTree {
  const task = data?.get(taskId)
  const children = selectSubTaskIds(task).map((subTaskId) => selectTree(subTaskId, data)).filter((it) => it.task || it.children.length)
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
