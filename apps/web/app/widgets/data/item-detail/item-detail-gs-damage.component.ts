import { CommonModule } from '@angular/common'
import { Component, computed, HostBinding, inject } from '@angular/core'
import {
  getDamageCoefForWeaponTag,
  getDamageFactorForGearScore,
  getWeaponTagFromWeapon,
  isAffixSplitDamage,
} from '@nw-data/common'
import { firstValueFrom } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { damageTypeIcon, NwWeaponTypesService } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { apiResource } from '~/utils'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-gs-damage',
  template: `
    @for (row of rows(); track $index) {
      <div class="flex flex-row gap-1" animate.enter="fade-grow-y-in" animate.leave="fade-grow-y-out">
        <img [nwImage]="row.icon" class="w-5 h-5" />
        <span class="font-bold">{{ row.value | number: '0.0-0' }}</span>
        <span class="opacity-50">{{ row.label | nwText }}</span>
      </div>
    }
  `,
  host: {
    class: 'block',
    '[class.hidden]': 'isHidden()',
  },
  imports: [CommonModule, IconsModule, NwModule],
})
export class ItemDetailGsDamage {
  private db = injectNwData()
  private store = inject(ItemDetailStore)
  private weapons = inject(NwWeaponTypesService)

  protected resource = apiResource({
    request: () => {
      const weaponId = this.store.item()?.ItemStatsRef
      const affixIds = this.store.itemPerkSlots()?.map((it) => it?.perk?.Affix)
      return { weaponId, affixIds }
    },
    loader: async ({ request }) => {
      const weapon = await this.db.weaponItemsById(request.weaponId)
      const weaponTag = getWeaponTagFromWeapon(weapon)
      const weaponType = await firstValueFrom(this.weapons.forWeaponTag(weaponTag))
      const damageType = weaponType?.DamageType
      const affixes = await Promise.all(request.affixIds.map((it) => this.db.affixStatsById(it)))
      return {
        weapon,
        weaponTag,
        weaponType,
        damageType,
        affixes,
      }
    },
  })

  protected rows = computed(() => {
    const value = this.resource.value()
    if (!value || !value.damageType) {
      return []
    }
    const { weapon, weaponTag, damageType, affixes } = this.resource.value()
    const dmgGS = getDamageFactorForGearScore(this.store.itemGS())
    const dmgCoef = getDamageCoefForWeaponTag(weaponTag)
    const dmgBase = weapon?.BaseDamage || 0
    const split = affixes.find(isAffixSplitDamage)
    const dmg = dmgBase * dmgGS * dmgCoef
    if (split) {
      return [
        buildRow(damageType, Math.floor(dmg * (1 - split.DamagePercentage))),
        buildRow(split.DamageType, Math.floor(dmg * split.DamagePercentage)),
      ]
    }
    return [buildRow(damageType, Math.floor(dmg))]
  })

  protected isHidden = computed(() => !this.rows()?.length)
}

function buildRow(type: string, dmg: number) {
  return {
    icon: damageTypeIcon(type),
    label: `${type}_DamageName`,
    value: dmg,
  }
}
