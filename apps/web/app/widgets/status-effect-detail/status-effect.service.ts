import { Injectable } from '@angular/core'
import { Statuseffect } from '@nw-data/types'
import { combineLatest, map, ReplaySubject } from 'rxjs'
import { NwDbService } from '~/nw'
import { shareReplayRefCount } from '~/utils'

@Injectable()
export class StatusEffectDetailService {
  public readonly effectId$ = new ReplaySubject<string>(1)
  public readonly effect$ = combineLatest({
    id: this.effectId$,
    statusEffects: this.db.statusEffectsMap,
  })
    .pipe(map(({ id, statusEffects }) => statusEffects.get(id)))
    .pipe(shareReplayRefCount(1))

  public readonly icon$ = this.effect$.pipe(map((it) => it?.PlaceholderIcon))
  public readonly name$ = this.effect$.pipe(map((it) => it?.DisplayName))
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
    exclude = exclude || ['$source', 'StatusID', 'PlaceholderIcon', 'DisplayName', 'Description']
    return Object.entries(item)
      .filter(([key, value]) => !!value && !exclude.includes(key as any))
      .map(([key, value]) => ({
        key,
        value,
        valueType: typeof value,
      }))
  }
}
