import { Injectable, signal } from '@angular/core'
import { AppDbRecord, AppDbTable } from '../../app-db'
import { BackendAdapter } from '../backend-adapter'

@Injectable({ providedIn: 'root' })
export class NoBackendAdapter extends BackendAdapter {
  public isEnabled = signal(false)
  public isOnline = signal(false)
  public session = signal({
    token: null,
    id: null,
    name: null,
  })

  public async signIn(): Promise<void> {
    //
  }

  public async signOut(): Promise<void> {
    //
  }

  public initPrivateTable(table: AppDbTable<AppDbRecord>) {
    return null
  }

  public initPublicTable(table: string) {
    return null
  }
}
