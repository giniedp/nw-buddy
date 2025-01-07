import { RecordService, RecordSubscription } from 'pocketbase'
import { Observable } from 'rxjs'

export interface CollectionEvent<T> {
  action: RecordSubscription['action']
  record: T
}

export function collectionEvents<T>(collection: RecordService<T>): Observable<CollectionEvent<T>> {
  return new Observable<CollectionEvent<T>>((sub) => {
    const subscription = collection.subscribe('*', (e) => {
      sub.next({ action: e.action, record: e.record })
    })
    return () => {
      subscription.then((it) => it())
    }
  })
}
