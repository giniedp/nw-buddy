import { CommonModule } from '@angular/common'
import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core'
import { Gamemodes, Vitals } from '@nw-data/types'
import { combineLatest, defer, map, merge, ReplaySubject, switchMap } from 'rxjs'
import { NwDamagetypeService, NwDbService, NwModule, NwService, NwVitalsService } from '~/nw'
import { getVitalDamageEffectiveness } from '~/nw/utils'
import { DestroyService } from '~/utils'

const FAMILY_META = {
  wildlife: {
    Icon: 'assets/images/missionimage_wolf.png',
    Name: 'VC_Beast',
  },
  ancientguardian: {
    Icon: 'assets/images/missionimage_ancient1.png',
    Name: 'VC_Ancient',
  },
  corrupted: {
    Icon: 'assets/images/missionimage_corrupted2.png',
    Name: 'VC_Corrupted',
  },
  angryearth: {
    Icon: 'assets/images/missionimage_angryearth1.png',
    Name: 'VC_Angryearth',
  },
  lost: {
    Icon: 'assets/images/missionimage_undead1.png',
    Name: 'VC_Lost',
  },
  fae: {
    Icon: '',
    Name: 'Fae',
  },
}

@Component({
  standalone: true,
  selector: 'nwb-vital-detail',
  templateUrl: './vital-detail.component.html',
  styleUrls: ['./vital-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  providers: [DestroyService],
  host: {
    class: 'backdrop-blur-sm bg-white/10 rounded-md overflow-clip',
  },
})
export class VitalDetailComponent {
  @Input()
  public set vital(value: Partial<Vitals>) {
    this.vital$.next(value as Vitals)
  }

  @Input()
  public isGroup: boolean

  @Input()
  public dungeons: Gamemodes[]

  protected readonly vital$ = new ReplaySubject<Vitals>(1)
  protected readonly marker$ = defer(() => this.vital$).pipe(map((it) => this.vitals.vitalMarkerIcon(it)))
  protected readonly familyName = defer(() => this.vital$).pipe(map((it) => FAMILY_META[it?.Family?.toLowerCase()]?.Name))
  protected readonly familyIcon = defer(() => this.vital$).pipe(map((it) => FAMILY_META[it?.Family?.toLowerCase()]?.Icon))
  protected readonly stats$ = defer(() => {
    return combineLatest({
      vital: this.vital$,
      gems: this.db.viewGemPerksWithAffix,
      dmgwpn: this.dmg.damageTypeToWeaponType,
      damagetypes: this.dmg.damagetypes,
    })
  }).pipe(
    map(({ vital, gems, damagetypes, dmgwpn }) => {
      return damagetypes
        .map((dmgType) => {
          return {
            Name: dmgType.DisplayName,
            Type: dmgType.TypeID,
            Category: dmgType.Category,
            Icon: this.dmg.damageTypeIcon(dmgType),
            Value: getVitalDamageEffectiveness(vital, dmgType.TypeID as any),
            Perk: gems
              .filter(({ stat, perk }) => perk.Tier === 4 && stat.DamageType === dmgType.TypeID)
              .map(({ perk }) => perk)[0],
            Weapons: dmgwpn[dmgType.TypeID] || [],
          }
        })
        .filter((row) => !!row.Value)
        .sort((a, b) => a.Value - b.Value)
    })
  )

  public constructor(private db: NwDbService, private dmg: NwDamagetypeService, private vitals: NwVitalsService) {
    //
  }
}
