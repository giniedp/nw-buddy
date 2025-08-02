import { computed, Injectable, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import PocketBase from 'pocketbase'
import { Subject } from 'rxjs'
import { AppDbRecord } from '~/data/app-db'
import { environment } from '../../../../environments'
import { BackendAdapter, SessionState } from '../backend-adapter'
import { authState } from './auth-state'
import { PocketbasePrivateTable } from './pocketbase-private-table'
import { PocketbasePublicTable } from './pocketbase-public-table'

@Injectable({ providedIn: 'root' })
export class PocketbaseAdapter extends BackendAdapter {
  public readonly client = new PocketBase(environment.pocketbaseUrl)
  private readonly authState = toSignal(authState(this.client))

  public isEnabled = signal(true)
  public isOnline = signal(false)
  public userSignedIn = new Subject<SessionState>()
  public userSignedOut = new Subject<SessionState>()
  public session = computed(() => {
    const { token, record } = this.authState()
    return {
      token,
      id: record?.id,
      name: record?.['name'] as string,
    }
  })

  public constructor() {
    super()
    this.client.autoCancellation(false)
    this.refreshSession()
  }

  public async refreshSession() {
    if (!this.session()?.id) {
      this.isOnline.set(false)
      return
    }
    await this.client
      .collection('users')
      .authRefresh()
      .then(() => {
        this.isOnline.set(true)
      })
      .catch((error) => {
        this.isOnline.set(false)
      })
  }

  public async signIn(): Promise<void> {
    await this.client
      .collection('users')
      .authWithOAuth2({
        provider: 'discord',
      })
      .then((data) => {
        this.isOnline.set(true)
        this.userSignedIn.next({
          id: data.record.id,
          name: data.record?.['name'] as string,
          token: data.token,
        })
      })
  }

  public async signOut(): Promise<void> {
    const currentSession = this.session()
    if (!currentSession?.id) {
      return
    }
    // https://github.com/pocketbase/pocketbase/discussions/2686
    this.client.realtime.unsubscribe()
    this.client.authStore.clear()
    this.userSignedOut.next(currentSession)
  }

  public initPrivateTable<T extends AppDbRecord>(table: string) {
    return new PocketbasePrivateTable<T>(this.client, table)
  }

  public initPublicTable<T extends AppDbRecord>(table: string) {
    return new PocketbasePublicTable<T>(this.client, table)
  }
}
