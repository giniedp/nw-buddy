import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { combineLatest, defer, map, ReplaySubject } from 'rxjs'
import { NwDamagetypeService, NwService, NwVitalsService } from '~/core/nw'
import { DestroyService } from '~/core/utils'

@Component({
  selector: 'nwb-vital-detail',
  templateUrl: './vital-detail.component.html',
  styleUrls: ['./vital-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
})
export class VitalDetailComponent implements OnInit {
  @Input()
  public set vital(value: Vitals) {
    this.vital$.next(value)
  }

  public stats$ = defer(() => {
    return combineLatest({
      vital: this.vital$,
      gems: this.nw.db.viewGemPerksWithAffix,
      dmgwpn: this.dmg.damageTypeToWeaponType,
      damagetypes: this.dmg.damagetypes
    })
  }).pipe(
    map(({ vital, gems, damagetypes, dmgwpn }) => {
      return damagetypes.map((dmgType) => {
        return {
          Name: dmgType.DisplayName,
          Type: dmgType.TypeID,
          Category: dmgType.Category,
          Icon: this.dmg.damageTypeIcon(dmgType),
          Value: this.vitals.damageEffectiveness(vital, dmgType.TypeID as any),
          Perk: gems.filter(({ stat }) => stat.DamageType === dmgType.TypeID).map(({ perk }) => perk).reverse()?.[0],
          Weapons: dmgwpn[dmgType.TypeID] || [],
        }
      })
        .filter((row) => !!row.Value)
        .sort((a, b) => a.Value - b.Value)
    })
  )

  public readonly vital$ = new ReplaySubject<Vitals>(1)

  public constructor(
    private nw: NwService,
    private dmg: NwDamagetypeService,
    private vitals: NwVitalsService,
  ) {
    //
  }

  public ngOnInit(): void {
    //
  }
}
