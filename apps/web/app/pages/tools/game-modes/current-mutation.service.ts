import { HttpClient } from '@angular/common/http'
import { InjectionToken, Signal, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NW_BUDDY_LIVE } from 'apps/web/environments'
import { BehaviorSubject, Observable, Subject, defer, firstValueFrom, switchMap, tap, throttleTime } from 'rxjs'
import { z } from 'zod'
import { shareReplayRefCount } from '~/utils'

const MutationEntrySchema = z.object({
  expedition: z.string(),
  element: z.string(),
  promotion: z.string(),
  curse: z.string(),
})
const MutationListSchema = z.array(MutationEntrySchema)

export type MutationList = z.infer<typeof MutationListSchema>
export type MutationEntry = z.infer<typeof MutationEntrySchema>

const THROTTLE_IN_MINUTES = 5
const API_ENDPOINT = `${NW_BUDDY_LIVE}/api/mutations`

export const CURRENT_MUTATION = new InjectionToken<Observable<MutationList>>('CURRENT_MUTATION', {
  providedIn: 'root',
  factory: () => {
    const http = inject(HttpClient)
    const context = new BehaviorSubject<MutationList>(null)
    const trigger = new Subject<void>()
    trigger
      .pipe(throttleTime(THROTTLE_IN_MINUTES * 60 * 1000))
      .pipe(switchMap(() => fetchMutationList(http)))
      .subscribe(context)

    return defer(() => context).pipe(
      tap({
        subscribe: () => trigger.next(),
      }),
    )
  },
})

export function injectCurrentMutation(): Signal<MutationList> {
  return toSignal(inject(CURRENT_MUTATION))
}

async function fetchMutationList(http: HttpClient): Promise<MutationList> {
  return firstValueFrom(http.get(API_ENDPOINT))
    .then((data) => MutationListSchema.parse(data))
    .catch((err) => {
      console.error(err)
      return null
    })
}
