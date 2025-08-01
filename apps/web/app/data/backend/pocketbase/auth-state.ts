import PocketBase, { AuthRecord } from 'pocketbase'
import { Observable } from 'rxjs'

export interface AuthState {
  token: string
  record: AuthRecord
}

export function authState(client: PocketBase): Observable<AuthState> {
  return new Observable<AuthState>((sub) => {
    return client.authStore.onChange((token, record) => {
      sub.next({ token, record })
    }, true)
  })
}
