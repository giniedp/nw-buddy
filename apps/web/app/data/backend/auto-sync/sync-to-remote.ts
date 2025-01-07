
import { Observable, switchMap, tap } from "rxjs"
import { AppDbRecord, AppDbTable, AppDbTableEvent } from "../../app-db"
import { PrivateTable } from "../backend-adapter"

export function syncToRemote<T extends AppDbRecord>(localTable: AppDbTable<T>, remoteTable: PrivateTable<T>): Observable<void> {
  const tableName = localTable.tableName
  const tag = `[${tableName.toUpperCase()}][syncToRemote]`

  return localTable.events.pipe(
    tap({
      subscribe: () => console.debug(tag, 'START'),
      next: ({ type, payload }) => console.debug(tag, 'EVENT:', type, payload),
      finalize: () => console.debug(tag, 'END'),
    }),
    switchMap(async ({ type, payload }) => {
      await handleEvent({ type, payload }).catch(console.error)
    }),
  )

  async function handleEvent(event: AppDbTableEvent<T>) {
    switch (event.type) {
      case 'create': {
        await onInsert(event.payload)
        break
      }
      case 'delete': {
        await onDelete(event.payload.id)
        break
      }
      case 'update': {
        await onUpdate(event.payload)
        break
      }
    }
  }

  async function onInsert(record: T) {
    console.debug(tag, 'CREATE', record.id)
    await remoteTable.create(record)
  }

  async function onUpdate(record: AppDbRecord) {
    console.debug(tag, 'UPDATE', record.id)
    const local = await localTable.read(record.id)
    const remote = remoteTable.read(record.id).catch(() => null)
    if (!remote) {
      await remoteTable.create(local)
    } else {
      remoteTable.update(local.id, local)
    }
  }

  async function onDelete(id: string | string[]) {
    console.debug(tag, 'DELETE', id)
    return remoteTable.delete(id)
  }
}
