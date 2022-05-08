import { Component, OnInit, ChangeDetectionStrategy, Input, Host } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { combineLatest, defer, map, ReplaySubject, switchMap, takeUntil } from 'rxjs'
import { NwService, queryDamageTypeToWeaponType, queryGemPerksWithAffix } from '~/core/nw'
import { DestroyService, shareReplayRefCount } from '~/core/utils'

const ICON_MAP: Record<string, string> = {
  Arcane: 'icon_tooltip_arcane_opaque',
  Corruption: 'icon_tooltip_corruption_opaque',
  Fire: 'icon_tooltip_fire_opaque',
  Ice: 'icon_tooltip_ice_opaque',
  Lightning: 'icon_tooltip_lightning_opaque',
  Nature: 'icon_tooltip_nature',
  Siege: 'icon_tooltip_siege_opaque',
  Slash: 'icon_tooltip_slash_opaque',
  Standard: 'icon_tooltip_standard_opaque',
  Strike: 'icon_tooltip_strike_opaque',
  Thrust: 'icon_tooltip_thrust_opaque',
}

type VitalInput = Pick<
  Vitals,
  | 'DisplayName'
  | 'CreatureType'
  | 'ABSArcane'
  | 'ABSCorruption'
  | 'ABSFire'
  | 'ABSIce'
  | 'ABSLightning'
  | 'ABSNature'
  | 'ABSSiege'
  | 'ABSSlash'
  | 'ABSStandard'
  | 'ABSStrike'
  | 'ABSThrust'
  | 'WKNArcane'
  | 'WKNCorruption'
  | 'WKNFire'
  | 'WKNIce'
  | 'WKNLightning'
  | 'WKNNature'
  | 'WKNSiege'
  | 'WKNSlash'
  | 'WKNStandard'
  | 'WKNStrike'
  | 'WKNThrust'
>

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
      dmgwpn: this.nw.db.viewDamageTypeToWeaponType,
      damagetypes: this.nw.db.damagetypes
    })
  }).pipe(
    map(({ vital, gems, damagetypes, dmgwpn }) => {
      return damagetypes.map((dmgType) => {
        return {
          Name: dmgType.DisplayName,
          Type: dmgType.TypeID,
          Category: dmgType.Category,
          Icon: `assets/icons/tooltip/${ICON_MAP[dmgType.TypeID] || 'icon_unknown'}.png`,
          Value: (vital[`WKN${dmgType.TypeID}`] || 0) - (vital[`ABS${dmgType.TypeID}`] || 0),
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
    @Host()
    private destroy: DestroyService,
    private nw: NwService
  ) {
    //
  }

  public ngOnInit(): void {
    //
  }
}
