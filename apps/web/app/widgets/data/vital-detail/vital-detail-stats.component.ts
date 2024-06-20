import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { getVitalDamageEffectiveness } from '@nw-data/common'
import { VitalsData } from '@nw-data/generated'
import { uniq } from 'lodash'
import { NwModule } from '~/nw'
import { damageTypeIcon, getWeaponTypes } from '~/nw/weapon-types'
import { VitalDetailStore } from './vital-detail.store'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'

export interface DamageEffectiveness {
  value: number
  icon: string
  name: string
  weapons: Array<{
    name: string
    icon: string
  }>
}

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-stats',
  templateUrl: './vital-detail-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, TooltipModule],
  host: {
    class: 'block',
  },
})
export class VitalDetailStatsComponent {
  protected store = inject(VitalDetailStore)

  protected vital = toSignal(this.store.vital$)
  protected aliasNames = toSignal(this.store.aliasNames$)
  protected combatCategories = toSignal(this.store.combatCategories$)
  protected effectiveness = computed(() => selectEffectiveness(this.vital()))
  protected armor = toSignal(this.store.armor$)
  protected gearScore = toSignal(this.store.gearScore$)
  protected damage = toSignal(this.store.damage$)
  protected spawnLevels = selectSignal(this.store.metadata$, (it) => it?.levels?.join(', '))

  protected infoIcon = svgInfo
}

function selectEffectiveness(vital: VitalsData): DamageEffectiveness[] {
  if (!vital) {
    return []
  }
  const result: DamageEffectiveness[] = []

  const keys = uniq(
    Object.keys(vital)
      .filter((it) => it.startsWith('DMG') || it.startsWith('ABS'))
      .map((it) => it.replace('DMG', '').replace('ABS', '')),
  )

  for (const type of keys) {
    const dmg = getVitalDamageEffectiveness(vital, type as any)
    if (!dmg) {
      continue
    }
    result.push({
      value: dmg,
      icon: damageTypeIcon(type),
      name: type,
      weapons: getWeaponTypes()
        .filter((it) => it.DamageType === type)
        .map((it) => {
          return {
            name: it.UIName,
            icon: it.IconPathSmall,
          }
        }),
    })
  }
  return result.sort((a, b) => b.value - a.value)
}
