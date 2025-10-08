import { DecimalPipe } from '@angular/common'
import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { getDamageCoefForWeaponTag, getDamageFactorForGearScore, isAffixSplitDamage } from '@nw-data/common'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { damageTypeIcon, getWeaponTypeInfo } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgChartLine } from '../../../ui/icons/svg'
import { TooltipDirective } from '../../../ui/tooltip/tooltip.directive'
import { resourceValue } from '../../../utils'
import { WeaponScalingChartComponent } from '../weapon-definition-detail/weapon-scaling-chart.component'
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
      <a class="absolute top-2 right-2" [routerLink]="['weapon-definitions', data().weaponId] | nwLink">
        <nwb-icon
          [icon]="chartIcon"
          class="w-4 h-4"
          [tooltip]="tipChart"
          [tooltipClass]="['max-w-lg', 'aspect-video', 'w-[100vw]']"
        />
      </a>
      <ng-template #tipChart>
        <nwb-weapon-scaling-chart [weaponId]="data().weaponId" [affixId]="data().affix?.StatusID" />
      </ng-template>
    }
  `,
  host: {
    class: 'block relative',
    '[class.hidden]': 'isHidden()',
  },
  imports: [DecimalPipe, IconsModule, NwModule, WeaponScalingChartComponent, TooltipDirective, RouterLink],
})
export class ItemDetailGsDamage {
  private db = injectNwData()
  private store = inject(ItemDetailStore)

  protected chartIcon = svgChartLine
  protected data = resourceValue({
    keepPrevious: true,
    params: () => {
      const weaponId = this.store.item()?.ItemStatsRef
      const affixIds = this.store
        .itemPerkSlots()
        ?.map((it) => it?.perk?.Affix)
        ?.filter((it) => !!it)
      return { weaponId, affixIds }
    },
    loader: async ({ params: { weaponId, affixIds } }) => {
      const weapon = await this.db.weaponItemsById(weaponId)
      const weaponTag = weapon?.MannequinTag.find((it) => !!getWeaponTypeInfo(it))
      const weaponType = getWeaponTypeInfo(weaponTag)
      const damageType = weaponType?.DamageType
      const affixes = await Promise.all(affixIds.map((it) => this.db.affixStatsById(it)))
      return {
        weapon,
        weaponId,
        weaponTag,
        weaponType,
        damageType,
        affix: affixes.find(isAffixSplitDamage),
      }
    },
    defaultValue: {
      weapon: null,
      weaponId: null,
      weaponTag: null,
      weaponType: null,
      damageType: null,
      affix: null,
    },
  })

  protected rows = computed(() => {
    const { weapon, weaponTag, damageType, affix } = this.data()
    if (!weapon) {
      return []
    }
    const dmgGS = getDamageFactorForGearScore(this.store.itemGS())
    const dmgCoef = getDamageCoefForWeaponTag(weaponTag)
    const dmgBase = weapon?.BaseDamage || 0
    const dmg = dmgBase * dmgGS * dmgCoef
    const split = affix
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
