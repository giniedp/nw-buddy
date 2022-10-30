import { Injectable, InjectionToken, Type } from "@angular/core"
import { wrap } from 'comlink'
import type { ItemsTableTasks } from "./items-table.worker"
export type { ItemsTableTasks } from "./items-table.worker"

export const ITEMS_TABLE_TASKS = new InjectionToken<ItemsTableTasks>('ITEMS_TABLE_TASKS', {
  providedIn: 'root',
  factory: () => {
    const worker = new Worker(new URL('./items-table.worker', import.meta.url))
    return wrap<ItemsTableTasks>(worker)
  }
})
