import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BuffBucket, NW_FALLBACK_ICON } from '@nw-data/common'
import { AbilityData, StatusEffectData } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgInfoCircle } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { apiResource, humanize } from '~/utils'
import { AbilityDetailModule } from '../ability-detail'
import { StatusEffectDetailModule } from '../status-effect-detail'
import { VitalDetailStore } from './vital-detail.store'

@Component({
  selector: 'nwb-vital-detail-buffs',
  templateUrl: './vital-detail-buffs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    TooltipModule,
    RouterLink,
    StatusEffectDetailModule,
    AbilityDetailModule,
    IconsModule,
  ],
  host: {
    class: 'flex flex-col gap-2 leading-tight relative',
  },
})
export class VitalDetailBuffsComponent {
  private db = injectNwData()
  private store = inject(VitalDetailStore)

  private resource = apiResource({
    request: () => {
      const element = this.store.mutaElement()
      const type = this.store.creatureType()
      return {
        vitalBuffBucketIds: (this.store.vital()?.BuffBuckets || '').split(','),
        mutaBuffBucketIds: (element?.[type as 'Dungeon'] || '').split(','),
      }
    },
    loader: async ({ request: { mutaBuffBucketIds, vitalBuffBucketIds } }) => {
      const buffMap = await this.db.buffBucketsByIdMap()
      const effectMap = await this.db.statusEffectsByIdMap()
      const abilitiesMap = await this.db.abilitiesByIdMap()
      return {
        mutaBuffs: collectVitalBuffs({
          bucketIds: mutaBuffBucketIds,
          buffMap,
          effectMap,
          abilitiesMap,
        }),
        vitalBuffs: collectVitalBuffs({
          bucketIds: vitalBuffBucketIds,
          buffMap,
          effectMap,
          abilitiesMap,
        }),
      }
    },
  })
  protected isLoading = computed(() => this.store.isLoading() || this.resource.isLoading())
  protected isLoaded = computed(() => this.store.isLoaded() && this.resource.isLoaded())
  protected hasError = this.resource.hasError
  protected errorIcon = svgCircleExclamation
  protected infoIcon = svgInfoCircle

  protected buffs = computed(() => {
    return [...(this.resource.value()?.mutaBuffs || []), ...(this.resource.value()?.vitalBuffs || [])]
  })
  protected effects = computed(() => {
    return this.buffs()
      .filter((it) => it.effect)
      .map(({ effect, chance, odd }) => {
        return {
          id: effect.StatusID,
          icon: effect.PlaceholderIcon || NW_FALLBACK_ICON,
          label: effect.DisplayName || humanize(effect.StatusID),
          text: effect.Description || (effect.DisplayName ? `${effect.StatusID}_Tooltip` : ''),
          chance: chance,
          odd: odd,
        }
      })
  })

  protected abilities = computed(() => {
    return this.buffs()
      .filter((it) => it.ability)
      .map(({ ability, chance, odd }) => {
        return {
          id: ability.AbilityID,
          icon: ability.Icon || NW_FALLBACK_ICON,
          label: ability.DisplayName || ability.AbilityID,
          chance: chance,
          odd: odd,
        }
      })
  })
}

export interface VitalBuff {
  chance: number
  effect?: StatusEffectData
  ability?: AbilityData
  odd: boolean
}

export function collectVitalBuffs(
  data: {
    bucketIds: string[]
    buffMap: Map<string, BuffBucket>
    effectMap: Map<string, StatusEffectData>
    abilitiesMap: Map<string, AbilityData>
    chance?: number
    odd?: boolean
  },
  result: VitalBuff[] = [],
) {
  let odd = data.odd ?? true
  for (const bucketId of data.bucketIds || []) {
    const bucket = data.buffMap.get(bucketId)
    if (!bucket?.Buffs?.length) {
      continue
    }
    if (data.odd == null && bucket.TableType === 'OR') {
      odd = !odd
    }
    for (let i = 0; i < bucket.Buffs.length; i++) {
      const chance = getBuffChance(bucket, i) * (data.chance ?? 1)
      const row = bucket.Buffs[i]

      if (row.BuffType === 'StatusEffect') {
        appendBuff(result, {
          chance,
          effect: data.effectMap.get(row.Buff),
          odd,
        })
        continue
      }
      if (row.BuffType === 'BuffBucket' && row.Buff) {
        collectVitalBuffs(
          {
            ...data,
            bucketIds: [row.Buff],
            chance,
            odd,
          },
          result,
        )
        continue
      }
      if (row.BuffType === 'Ability') {
        appendBuff(result, {
          chance,
          ability: data.abilitiesMap.get(row.Buff),
          odd,
        })
        continue
      }
      if (row.BuffType === 'Promotion') {
        continue
      }
    }
  }

  return result
}

function appendBuff(buffs: VitalBuff[], buff: VitalBuff) {
  const existing = buffs.find((it) => {
    if (buff.effect) {
      return it.effect?.StatusID === buff.effect.StatusID
    }
    if (buff.ability) {
      return it.ability?.AbilityID === buff.ability.AbilityID
    }
    return false
  })
  if (existing) {
    existing.chance = Math.max(existing.chance, buff.chance)
  } else {
    buffs.push(buff)
  }
}

function getBuffChance(bucket: BuffBucket, row: number) {
  if (bucket.TableType === 'AND') {
    if (bucket.MaxRoll > 0) {
      console.warn('AND table with MaxRoll > 0')
    }
    return 1
  }

  if (!bucket.MaxRoll) {
    console.warn('OR table with MaxRoll = 0')
    return 1
  }

  const prob = Number(bucket.Buffs[row].BuffProb)
  let ceiling = bucket.MaxRoll
  if (row < bucket.Buffs.length - 1) {
    ceiling = Number(bucket.Buffs[row + 1].BuffProb)
  }
  return (ceiling - prob) / bucket.MaxRoll
}
