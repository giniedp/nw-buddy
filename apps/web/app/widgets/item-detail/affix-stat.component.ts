import { Component, Input } from '@angular/core'
import { Perks } from '@nw-data/types'
import { BehaviorSubject, combineLatest, defer, map, ReplaySubject } from 'rxjs'
import { NwService } from '~/core/nw'
import { getPerkAffixStat, hasPerkAffixStats } from '~/core/nw/utils'

@Component({
  selector: 'nwb-affixstat',
  template: `
    <div *ngFor="let mod of mods | async">
      <b>{{ mod.value }} </b><span [nwText]="mod.label"></span>
    </div>
    <div *ngIf="showName && perk && perk.DisplayName">
      (<span *ngIf="perk && perk.DisplayName" [nwText]="perk.DisplayName"></span>)
    </div>
  `,
})
export class AffixStatComponent {
  @Input()
  public set perk(value: Perks) {
    this.perk$.next(value)
  }
  public get perk() {
    return this.perk$.value
  }

  @Input()
  public showName: boolean

  @Input()
  public set gearScore(value: number) {
    this.gearScore$.next(value)
  }

  public affix = defer(() => combineLatest({
    perk: this.perk$,
    affixStats: this.nw.db.affixstatsMap,
  })).pipe(map(({ perk, affixStats }) => affixStats.get(perk.Affix)))

  public mods = defer(() => combineLatest({
    perk: this.perk$,
    affix: this.affix,
    score: this.gearScore$
  }) ).pipe(
    map(({ perk, affix, score }) => {
      if (hasPerkAffixStats(perk)) {
        return getPerkAffixStat(perk, affix, score)
      }
      return []
    })
  )

  private perk$ = new BehaviorSubject<Perks>(null)
  private gearScore$ = new BehaviorSubject<number>(600)

  public constructor(private nw: NwService) {}
}
