import { Component, Input } from '@angular/core'
import { BehaviorSubject, combineLatest, defer, map, ReplaySubject } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-affixstat',
  template: `
    <div *ngFor="let mod of mods | async">
      <b [nwText]="mod.label"></b> <span> {{ mod.value | number:'1.0-0' }}</span>
    </div>
  `,
})
export class AffixStatComponent {
  @Input()
  public set affix(affix: string) {
    this.affix$.next(affix)
  }

  @Input()
  public set scale(value: number) {
    this.scale$.next(value)
  }

  public affixstats = defer(() => combineLatest({
    affix: this.affix$,
    affixStats: this.nw.db.affixstatsMap,
  })).pipe(map(({ affix, affixStats }) => affixStats.get(affix)))

  public mods = defer(() => combineLatest({
    scale: this.scale$,
    affix: this.affixstats
  }) ).pipe(
    map(({ scale, affix }) => {
      return Object.keys(affix)
        .filter((it) => it.startsWith('MOD'))
        .map((key) => {
          const label = key.replace('MOD', '').toLowerCase()
          const rawValue = String(affix[key])
          return {
            label: `ui_${label}`,
            value: rawValue.split('-').map((value) => Math.round(Number(value) * Math.floor(scale)) ).join('-'),
          }
        })
    })
  )

  private affix$ = new ReplaySubject<string>(1)
  private scale$ = new BehaviorSubject<number>(1)

  public constructor(private nw: NwService) {}
}
