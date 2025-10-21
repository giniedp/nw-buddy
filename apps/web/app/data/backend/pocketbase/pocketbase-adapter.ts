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
    const avatarUrl = record?.['avatar'] 
      ? this.client.files.getURL(record, record['avatar'], { thumb: '64x64' })
      : undefined
    return {
      token,
      id: record?.id,
      name: record?.['name'] as string,
      avatarUrl,
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
      .then(async (data) => {
        const meta = data.meta

        // Update user profile with Discord avatar and name on every login
        // This ensures the avatar stays in sync if they update it on Discord
        if (meta?.['avatarUrl']) {
          try {
            const formData = new FormData()

            // Fetch the Discord avatar
            const response = await fetch(meta['avatarUrl'])
            if (response.ok) {
              const file = await response.blob()
              formData.append('avatar', file)
            }
            
            if (meta['avatarURL']) {
              formData.append('avatar_url', meta['avatarURL'])
            }

            // Set the user's display name from Discord
            if (meta['name']) {
              formData.append('name', meta['name'])
            }

            if (meta['id']) {
              formData.append('discord_id', meta['id'])
            }

            // Set the user's username from Discord (if available)
            if (meta['username']) {
              formData.append('username', meta['username'])
            }

            // Update the user record with avatar, name, and username
            await this.client.collection('users').update(data.record.id, formData)
          } catch (error) {
            console.error('Failed to update user profile with Discord avatar:', error)
          }
        }

        this.isOnline.set(true)
        const avatarUrl = data.record?.['avatar']
          ? this.client.files.getURL(data.record, data.record['avatar'], { thumb: '64x64' })
          : undefined
        this.userSignedIn.next({
          id: data.record.id,
          name: data.record?.['name'] as string,
          token: data.token,
          avatarUrl,
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
