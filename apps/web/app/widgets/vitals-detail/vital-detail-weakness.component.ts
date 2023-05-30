import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Perks, Vitals } from '@nw-data/generated'
import { combineLatest, defer, map, ReplaySubject } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getVitalDamageEffectiveness } from '~/nw/utils'
import { NwWeaponTypesService, damageTypeIcon } from '~/nw/weapon-types'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-weakness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  styles: [],
  host: {
    class: 'stats stats-vertical',
  },
  template: `
    <div class="stat place-items-center py-1 px-2" *ngFor="let row of stats$ | async">
      <div
        class="stat-value text-2xl"
        [class.text-success]="row.Value > 0"
        [class.text-warning]="row.Value < 0"
        [class.text-error]="row.Value < -0.2"
      >
        {{ row.Value > 0 ? '+' : '' }}{{ row.Value | percent }}
      </div>
      <div class="stat-title flex flex-row">
        <img [nwImage]="row.Icon" class="w-6 h-6 mr-1" />
        <span [nwText]="row.Name"></span>
      </div>
      <div class="stat-desc flex flex-row gap-1 opacity-100">
        <span *ngFor="let wpn of row.Weapons" [nwText]="wpn.GroupName" [nwTextAttr]="'data-tip'" class="tooltip">
          <img [nwImage]="wpn.IconPath" class="w-5 h-5 mr-1" />
        </span>
        <span *ngIf="row.Perk" [nwText]="row.Perk.DisplayName" [nwTextAttr]="'data-tip'" class="tooltip">
          <img [nwImage]="row.Perk.IconPath" class="w-5 h-5 mr-1" />
        </span>
      </div>
    </div>
  `,
})
export class VitalDetailWeaknessComponent {
  @Input()
  public set vital(value: Vitals) {
    this.vital$.next(value)
  }

  protected vital$ = new ReplaySubject<Vitals>(1)
  protected stats$ = defer(() => {
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
            Icon: damageTypeIcon(dmgType.TypeID),
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
  public constructor(private db: NwDbService, private wpn: NwWeaponTypesService) {}
}
