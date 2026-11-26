import { computed, Injectable, signal } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { catchError, map, Observable, of, retry, timer } from 'rxjs'
import { environment } from '../../../environments'

/**
 * Retries of a health check that nwbt does not answer, then the check gives up until a consumer asks again
 */
const RETRY_COUNT = 12
/**
 * Delay of the first retry in ms, doubling per retry up to {@link RETRY_MAX_DELAY}: about 90 s in all
 */
const RETRY_DELAY = 1000
const RETRY_MAX_DELAY = 10000

@Injectable({ providedIn: 'root' })
export class NwbtService {
  /**
   * Number of requested checks. Nothing is sent before the first {@link check}: a request to localhost makes the
   * browser ask the user for permission to reach local network devices
   */
  private requests = signal(0)
  private health = rxResource({
    params: () => this.requests() || undefined,
    stream: () => healthCheck(environment.nwbtUrl),
    defaultValue: null as boolean | null,
  })

  /**
   * Whether nwbt answered the latest check, null before the first check ends or without a check
   */
  public readonly available = computed(() => this.health.value())
  /**
   * A check or its retries are running
   */
  public readonly checking = computed(() => this.health.isLoading())

  /**
   * Starts a health check with its retries, unless one runs or nwbt answered
   */
  public check() {
    if (this.health.isLoading() || this.health.value()) {
      return
    }
    this.requests.update((it) => it + 1)
  }

  /**
   * Records an answer of nwbt from a check outside this service, e.g. the pak page
   */
  public markAvailable() {
    if (!this.health.value()) {
      this.health.set(true)
    }
  }
}

/**
 * `true` once `/health` answers, retried with a growing delay; `false` when the retries are used up or without url
 */
function healthCheck(nwbtUrl: string): Observable<boolean> {
  if (!nwbtUrl) {
    return of(false)
  }
  return fetchHealth(`${nwbtUrl}/health`).pipe(
    retry({
      count: RETRY_COUNT,
      delay: (_, attempt) => timer(Math.min(RETRY_DELAY * 2 ** (attempt - 1), RETRY_MAX_DELAY)),
    }),
    catchError(() => of(false)),
  )
}

/**
 * One request, `true` when it answers ok, an error otherwise. Aborted when unsubscribed.
 */
function fetchHealth(url: string): Observable<boolean> {
  return new Observable<Response>((subscriber) => {
    const abort = new AbortController()
    fetch(url, { cache: 'no-store', signal: abort.signal }).then(
      (res) => {
        subscriber.next(res)
        subscriber.complete()
      },
      (err) => subscriber.error(err),
    )
    return () => abort.abort()
  }).pipe(
    map((res) => {
      if (!res.ok) {
        throw new Error(`nwbt health ${res.status}`)
      }
      return true
    }),
  )
}
