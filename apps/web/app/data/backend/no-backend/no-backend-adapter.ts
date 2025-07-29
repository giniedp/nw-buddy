import { Injectable, signal } from '@angular/core'
import { Subject } from 'rxjs'
import { BackendAdapter, SessionState } from '../backend-adapter'

@Injectable({ providedIn: 'root' })
export class NoBackendAdapter extends BackendAdapter {
  public userSignedIn = new Subject<SessionState>()
  public userSignedOut = new Subject<SessionState>()
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

  public initPrivateTable(table: string) {
    return null
  }

  public initPublicTable(table: string) {
    return null
  }
}
