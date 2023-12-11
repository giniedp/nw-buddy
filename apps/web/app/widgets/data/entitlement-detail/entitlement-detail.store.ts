import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { selectStream } from '~/utils'
import { selectEntitlementRewards } from './selectors'

@Injectable()
export class EntitlementDetailStore extends ComponentStore<{ entitlementId: string }> {
  protected db = inject(NwDbService)
  public readonly entitlementId$ = this.select(({ entitlementId }) => entitlementId)

  @Output()
  public readonly entitlement$ = selectStream(this.db.entitlement(this.entitlementId$))

  public readonly rewards$ = selectStream(
    this.entitlement$.pipe(
      switchMap((it) => {
        return selectEntitlementRewards(it, this.db)
      }),
    ),
  )

  public constructor() {
    super({ entitlementId: null })
  }

  public update(entitlementId: string) {
    this.patchState({ entitlementId: entitlementId })
  }
}
