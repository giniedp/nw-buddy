import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import {
  getDamageCoefForWeaponTag,
  getDamageFactorForGearScore,
  getWeaponTagFromWeapon,
  isAffixSplitDamage,
} from '@nw-data/common'
import { combineLatest, from, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { damageTypeIcon, NwWeaponTypesService } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { mapFilter, mapFind, mapList, switchMapCombineLatest } from '~/utils'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-gs-damage',
  template: `
    <div *ngFor="let item of vm$ | async; trackBy: trackBy" class="flex flex-row gap-1">
      <img [nwImage]="item.icon" class="w-5 h-5" />
      <span class="font-bold">{{ item.value | number: '0.0-0' }}</span>
      <span class="opacity-50">{{ item.label | nwText }}</span>
    </div>
  `,
  host: {
    class: 'block',
  },
  imports: [CommonModule, IconsModule, NwModule],
})
export class ItemDetailGsDamage {
  protected detail = inject(ItemDetailStore)
  private weapons = inject(NwWeaponTypesService)
  private db = injectNwData()

  protected trackBy = (i: number) => i
  protected weaponTag$ = this.detail.weaponStats$.pipe(map((it) => getWeaponTagFromWeapon(it)))
  protected weaponType$ = this.weaponTag$.pipe(switchMap((tag) => this.weapons.forWeaponTag(tag)))
  protected damageType$ = this.weaponType$.pipe(map((it) => it?.DamageType))
  protected splitDamage$ = this.detail.perkSlots$.pipe(
    switchMapCombineLatest((it) => from(this.db.affixStatsById(it?.perk?.Affix))),
    mapFilter((it) => !!it),
    mapFind(isAffixSplitDamage),
  )

  protected vm$ = combineLatest({
    dmgGS: this.detail.itemGS$.pipe(map(getDamageFactorForGearScore)),
    dmgCoef: this.weaponTag$.pipe(map(getDamageCoefForWeaponTag)),
    dmgBase: this.detail.weaponStats$.pipe(map((it) => it?.BaseDamage || 0)),
    dmgType: this.damageType$,
    split: this.splitDamage$,
  }).pipe(
    map(({ dmgGS, dmgCoef, dmgBase, dmgType, split }) => {
      const dmg = dmgBase * dmgGS * dmgCoef
      if (!dmg) {
        return []
      }
      if (split) {
        return [
          {
            type: dmgType,
            dmg: Math.floor(dmg * (1 - split.DamagePercentage)),
          },
          {
            type: split.DamageType,
            dmg: Math.floor(dmg * split.DamagePercentage),
          },
        ]
      }
      return [
        {
          dmg: Math.floor(dmg),
          type: dmgType,
        },
      ]
    }),
    mapList((it) => ({
      icon: damageTypeIcon(it.type),
      label: `${it.type}_DamageName`,
      value: it.dmg,
    })),
  )
}
