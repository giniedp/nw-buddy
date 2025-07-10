import { Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { AppDbRecord } from '../app-db'

export interface SessionState {
  id: string
  name: string
  token: string
}

export interface PublicTable<T extends AppDbRecord> {
  name: string
  page(page: number, perPage: number): Promise<T[]>
  read(options: { user: string; id: string }): Promise<T>
}

export interface PrivateTable<T extends AppDbRecord> {
  name: string
  list(): Promise<T[]>
  // TODO: search(query: string): Promise<T[]>
  create(data: T): Promise<T>
  read(id: string): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string | string[]): Promise<number>
  events$: Observable<BackendTableEvent<T>>
}

export interface BackendTableEvent<T extends AppDbRecord> {
  type: 'create' | 'update' | 'delete'
  record: T
}

export abstract class BackendAdapter {
  abstract readonly isEnabled: Signal<boolean>
  abstract readonly isOnline: Signal<boolean>
  abstract readonly session: Signal<SessionState>
  abstract signIn(): Promise<void>
  abstract signOut(): Promise<void>

  abstract userSignedIn: Observable<SessionState>
  abstract userSignedOut: Observable<SessionState>

  abstract initPrivateTable<T extends AppDbRecord>(table: string): PrivateTable<T>
  abstract initPublicTable<T extends AppDbRecord>(table: string): PublicTable<T>
}
