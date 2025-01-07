import { Observable, tap } from "rxjs"
import { AppDbRecord, AppDbTable } from "~/data/app-db"
import { PrivateTable, BackendTableEvent } from "../backend-adapter"

export function syncToLocal<T extends AppDbRecord>(localTable: AppDbTable<T>, remoteTable: PrivateTable<T>): Observable<void> {
  const tag = `[${localTable.tableName.toUpperCase()}][syncToLocal]`
  return new Observable<void>(() => {
    // this happens on subscribe
    console.debug(tag, 'START')
    const sub = remoteTable.events$.subscribe(handleEvent)

    return () => {
      // this happens on unsubscribe
      console.debug(tag, 'END')
      sub.unsubscribe()
    }
  })

  async function handleEvent(event: BackendTableEvent<T>) {
    console.debug(tag, 'EVENT:', event)
    switch (event.type) {
      case 'create': {
        await onInsert(event.record)
        break
      }
      case 'update': {
        await onUpdate(event.record)
        break
      }
      case 'delete': {
        await onDelete(event.record.id)
        break
      }
    }
  }

  async function onInsert(record: T) {
    console.debug(tag, 'INSERT', record.id)
    const local = await localTable.read(record.id)
    if (!local) {
      await localTable.create(record, { silent: true })
    }
  }

  async function onUpdate(remote: T) {
    console.debug(tag, 'UPDATE', remote.id)
    const local = await localTable.read(remote.id)
    if (!local) {
      // TODO: handle this case
      console.error(tag, 'LOCAL RECORD NOT FOUND')
      return
    }

    const localTime = new Date(local['updated_at'] || 0).toJSON()
    const remoteTime = new Date(remote['updated_at']).toJSON()
    console.debug(tag, 'LOCAL:', localTime, 'REMOTE:', remoteTime)
    if (localTime < remoteTime) {
      console.log('SUPABASE REALTIME ON UPDATE EVENT -> REMOTE AHEAD OF LOCAL')
      localTable.update(remote.id, remote, { silent: true })
    }
  }

  async function onDelete(id: string) {
    console.debug(tag, 'DELETE', id)
    const local = await localTable.read(id)
    if (local) {
      await localTable.destroy(id, { silent: true })
    }
  }
}

