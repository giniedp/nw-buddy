import { computed, Injectable, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { environment } from '../../../../environments'
import PocketBase from 'pocketbase'
import { AppDbRecord, AppDbTable } from '~/data/app-db'
import { BackendAdapter } from '../backend-adapter'
import { authState } from './auth-state'
import { PocketbasePrivateTable } from './pocketbase-private-table'
import { PocketbasePublicTable } from './pocketbase-public-table'

@Injectable({ providedIn: 'root' })
export class PocketbaseAdapter extends BackendAdapter {
  public readonly client = new PocketBase(environment.pocketbaseUrl)
  private readonly authState = toSignal(authState(this.client))

  public isEnabled = signal(true)
  public isOnline = signal(true)
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
    if (this.session()?.id) {
      this.refreshSession()
    }
  }

  public async refreshSession() {
    await this.client
      .collection('users')
      .authRefresh()
      .catch(() => {
        this.signOut()
      })
  }

  public async signIn(): Promise<void> {
    await this.client.collection('users').authWithOAuth2({
      provider: 'discord',
    })
  }

  public async signOut(): Promise<void> {
    this.client.authStore.clear()
  }

  public initPrivateTable<T extends AppDbRecord>(table: AppDbTable<T>) {
    return new PocketbasePrivateTable<T>(this.client, table)
  }

  public initPublicTable<T extends AppDbRecord>(table: string) {
    return new PocketbasePublicTable<T>(this.client, table)
  }
}
