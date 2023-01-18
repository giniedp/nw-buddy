import { Injectable, Output } from '@angular/core'
import { Statuseffect } from '@nw-data/types'
import { combineLatest, map, ReplaySubject } from 'rxjs'
import { NwDbService } from '~/nw'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class StatusEffectDetailService {
  public readonly effectId$ = new ReplaySubject<string>(1)
  public readonly effect$ = this.db.statusEffect(this.effectId$).pipe(shareReplayRefCount(1))
  public readonly icon$ = this.effect$.pipe(map((it) => it?.PlaceholderIcon || NW_FALLBACK_ICON))
  public readonly name$ = this.effect$.pipe(map((it) => it?.DisplayName))
  public readonly nameForDisplay$ = this.effect$.pipe(map((it) => it?.DisplayName || humanize(it?.StatusID)))
  public readonly source$ = this.effect$.pipe(map((it) => it?.['$source']))
  public readonly description$ = this.effect$.pipe(map((it) => it?.Description))
  public readonly properties$ = this.effect$.pipe(map((it) => this.getProperties(it))).pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService) {
    //
  }

  public update(entityId: string) {
    this.effectId$.next(entityId)
  }

  public getProperties(item: Statuseffect, exclude?: Array<keyof Statuseffect | '$source'>) {
    if (!item) {
      return []
    }
    exclude = exclude || ['$source', 'PlaceholderIcon', 'DisplayName', 'Description']
    return Object.entries(item)
      .filter(([key, value]) => !!value && !exclude.includes(key as any))
      .reduce((res, [key, value]) => {
        res[key] = value
        return res
      }, {} as Partial<Statuseffect>)
  }
}
