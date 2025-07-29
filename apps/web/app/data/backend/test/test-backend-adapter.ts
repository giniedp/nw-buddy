import { Injectable, signal } from '@angular/core'
import { patchState, signalState } from '@ngrx/signals'
import { AppDbRecord, AppDbTable } from '~/data/app-db'
import { BackendAdapter } from '../backend-adapter'
import { TestPrivateTable } from './test-private-table'
import { TestPublicTable } from './test-public-table'

@Injectable({ providedIn: 'root' })
export class TestBackendAdapter extends BackendAdapter {
  public isEnabled = signal(true)
  public isOnline = signal(true)
  public session = signalState({
    id: null,
    token: null,
    name: null,
  })

  public constructor() {
    super()
    if (this.session()?.id) {
      this.refreshSession()
    }
  }

  public async refreshSession() {
    //
  }

  public async signIn(): Promise<void> {
    patchState(this.session, {
      id: '12345',
      token: 'test-token',
      name: 'Test User',
    })
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 10)
    })
  }

  public async signOut(): Promise<void> {
    patchState(this.session, {
      id: null,
      token: null,
      name: null,
    })
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 10)
    })
  }

  public initPrivateTable<T extends AppDbRecord>(table: AppDbTable<T>) {
    return new TestPrivateTable<T>(this, table)
  }

  public initPublicTable<T extends AppDbRecord>(table: string) {
    return new TestPublicTable<T>(table)
  }
}
