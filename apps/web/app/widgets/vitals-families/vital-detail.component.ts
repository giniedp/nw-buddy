import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Gamemodes, Vitals } from '@nw-data/types'
import { combineLatest, defer, map, of, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getVitalCategoryInfo, getVitalDamageEffectiveness, getVitalFamilyInfo, isVitalNamed } from '~/nw/utils'
import { NwVitalsService } from '~/nw/vitals'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { DestroyService, shareReplayRefCount } from '~/utils'

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
  protected readonly categories$ = combineLatest({
    ids: this.vital$.pipe(map((it) => it?.VitalsCategories || [])),
    categories: this.db.vitalsCategoriesMap,
  })
    .pipe(map(({ ids, categories }) => ids.map((it) => categories.get(it)).filter((it) => !!it)))
    .pipe(shareReplayRefCount(1))

  protected readonly isNamed$ = this.vital$.pipe(map((it) => isVitalNamed(it)))
  protected readonly marker$ = this.vital$.pipe(map((vital) => this.vitals.vitalMarkerIcon(vital)))
  protected readonly familyInfo$ = this.vital$.pipe(map((it) => this.isGroup ? getVitalFamilyInfo(it) : getVitalCategoryInfo(it)))

  protected readonly stats$ = defer(() => {
    return combineLatest({
      vital: this.vital$,
      gems: this.db.viewGemPerksWithAffix,
      dmgwpn: this.wpn.byDamageType$,
      dmgTypes: this.wpn.damagetypes,
    })
  }).pipe(
    map(({ vital, gems, dmgTypes, dmgwpn }) => {
      return dmgTypes
        .map((dmgType) => {
          return {
            Name: dmgType.DisplayName,
            Type: dmgType.TypeID,
            Category: dmgType.Category,
            Icon: this.wpn.damageTypeIcon(dmgType.TypeID),
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

  public constructor(private db: NwDbService, private wpn: NwWeaponTypesService, private vitals: NwVitalsService) {
    //
  }
}
