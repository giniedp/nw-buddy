import { Injectable } from '@angular/core'
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { mapFilter, shareReplayRefCount } from '~/utils'

@Injectable()
export class VitalDetailService {
  public readonly vitalId$ = new BehaviorSubject<string>(null)
  public readonly vital$ = this.db.vital(this.vitalId$)
  public readonly modifier$ = this.vital$
    .pipe(switchMap((it) => this.db.vitalsModifier(it?.CreatureType)))
    .pipe(shareReplayRefCount(1))
  public readonly level$ = this.vital$
    .pipe(switchMap((it) => this.db.vitalsLevel(it?.Level)))
    .pipe(shareReplayRefCount(1))
  public readonly categories$ = combineLatest({
    ids: this.vital$.pipe(map((it) => it?.VitalsCategories || [])),
    categories: this.db.vitalsCategoriesMap,
  })
    .pipe(map(({ ids, categories }) => ids.map((it) => categories.get(it))))
    .pipe(mapFilter((it) => !!it))
    .pipe(shareReplayRefCount(1))


  public constructor(protected db: NwDbService) {}

  public update(vitalId: string) {
    this.vitalId$.next(vitalId)
  }
}
