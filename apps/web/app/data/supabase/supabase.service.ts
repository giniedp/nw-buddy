import { computed, effect, Injectable, signal, untracked } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { AuthSession, createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { filter, Observable, switchMap, tap } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { environment } from '../../../environments/environment'
import { AppDbRecord, AppDbTable } from '../app-db'
import { tableSyncStream } from './table-sync'
import type { Database } from './types'

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public readonly client: SupabaseClient<Database> = createClient(environment.supabaseUrl, environment.supabaseAnonKey)
  public readonly session = signal<AuthSession>(null)

  private user = computed(() => this.session()?.user)
  private identity = computed(() => this.user()?.identities?.[0]?.identity_data)

  public readonly accessToken = computed(() => this.session()?.access_token)
  public readonly avatarUrl = computed(() => this.identity()?.['avatar_url'])
  public readonly userName = computed(() => this.identity()?.['full_name'])
  public readonly userId = computed(() => this.user()?.['id'])
  public readonly isSignedIn = computed(() => !!this.accessToken())
  public readonly userId$ = toObservable(this.userId)

  constructor() {
    this.bindSession()
  }

  private bindSession() {
    this.client.auth.onAuthStateChange((event, session) => {
      if (event == 'INITIAL_SESSION') {
        this.session.set(session)
      }
      if (event == 'SIGNED_IN') {
        this.session.set(session)
      }
      if (event == 'TOKEN_REFRESHED') {
        this.session.set(session)
      }
      if (event == 'SIGNED_OUT') {
        this.session.set(null)
      }
    })

    effect(() => {
      const accessToken = this.accessToken()
      untracked(() => {
        this.client.realtime.setAuth(accessToken)
      })
    })

    this.client.auth.getSession().then(({ data }) => {
      return this.client.auth.refreshSession(data.session)
    })
  }

  public async fetchProfile(user: User) {
    const { error } = await this.client
      .from('profiles')
      .select(`username, avatar_url`)
      .eq('id', user.id)
      .limit(1)
      .single()
  }

  public async signIn() {
    const res = await this.client.auth.getSession()
    if (res.error || !res.data?.session) {
      await this.client.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: window ? window.location.href : null,
        },
      })
      return
    }

    await this.client.auth.refreshSession(res.data.session).then(({ data }) => {
      this.session.set(data.session)
    })
  }

  public async signOut() {
    await this.client.auth.signOut()
  }

  public updateProfile(profile: any) {
    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return this.client.from('profiles').upsert(update)
  }

  private tableSyncStreams = new Map<AppDbTable<any>, Observable<void>>()

  public tableSync<T extends AppDbRecord>(table: AppDbTable<T>) {
    if (!this.tableSyncStreams.has(table)) {
      this.tableSyncStreams.set(table, this.createTableSyncStream(table))
    }
    return this.tableSyncStreams.get(table)
  }

  private createTableSyncStream<T extends AppDbRecord>(table: AppDbTable<T>) {
    return this.userId$.pipe(
      filter((userId) => !!userId),
      switchMap((userId) => {
        return tableSyncStream({
          client: this.client,
          table,
          userId,
        })
      }),
      tap({
        subscribe: () => console.debug(`[${table.tableName.toUpperCase()}]`, `SYNC START`),
        finalize: () => console.debug(`[${table.tableName.toUpperCase()}]`, `SYNC STOP`),
      }),
      shareReplayRefCount(1),
    )
  }
}
