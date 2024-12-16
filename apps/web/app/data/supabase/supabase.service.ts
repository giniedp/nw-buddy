import { computed, effect, Injectable, signal } from '@angular/core'
import { AuthChangeEvent, AuthSession, createClient, Session, SupabaseClient, User } from '@supabase/supabase-js'
import { environment } from '../../../environments/environment'
import type { Database } from './types'
import { toObservable } from '@angular/core/rxjs-interop'

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public readonly client: SupabaseClient<Database> = createClient(environment.supabaseUrl, environment.supabaseAnonKey)
  public readonly session = signal<AuthSession | null>(null)
  public readonly userId$ = toObservable(
    computed(() => {
      return this.session()?.user.id
    }),
  )

  constructor() {
    this.client.auth
      .getSession()
      .then(({ data }) =>
        this.client.auth.refreshSession(data.session).then(({ data }) => this.session.set(data.session)),
      )

    this.bindSession()

    effect(() => {
      if (!!this.session()) {
        this.client.realtime.setAuth(this.session().access_token)
      } else {
        this.client.realtime.setAuth(null)
      }
    })
  }

  getAvatarUrl() {
    const iden = this.session()?.user.identities[0].identity_data
    return iden['avatar_url']
  }

  getUsername() {
    const iden = this.session()?.user.identities[0].identity_data
    return iden['full_name']
  }

  private async bindSession() {
    this.authChanges((event, session) => {
      if (event == 'SIGNED_IN') {
        this.session.set(session)
      }
      if (event == 'SIGNED_OUT') {
        this.session.set(null)
      }
    })
  }

  async profile(user: User) {
    const { error } = await this.client
      .from('profiles')
      .select(`username, avatar_url`)
      .eq('id', user.id)
      .limit(1)
      .single()
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(callback)
  }

  async signIn() {
    const {
      data: { session },
      error,
    } = await this.client.auth.getSession()
    if (error || !session) {
      const response = await this.client.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: window ? window.location.href : null,
        },
      })
      return
    }

    const {
      data: { session: refreshedSession },
    } = await this.client.auth.refreshSession(session)

    this.session.set(refreshedSession)
  }

  async signOut() {
    await this.client.auth.signOut()
  }

  updateProfile(profile: any) {
    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return this.client.from('profiles').upsert(update)
  }
}
