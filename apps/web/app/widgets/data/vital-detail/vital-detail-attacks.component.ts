import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NW_FALLBACK_ICON, getVitalDamage } from '@nw-data/common'
import {
  Affixstats,
  Damagetable,
  Mutationdifficulty,
  Spellsmetadata,
  Statuseffect,
  Vitals,
  Vitalsleveldata,
  Vitalsmodifierdata,
} from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { damageTypeIcon } from '~/nw/weapon-types'
import { eqCaseInsensitive, humanize, selectStream } from '~/utils'
import { VitalDetailStore } from './vital-detail.store'
import { ScreenshotModule } from '~/widgets/screenshot'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectDetailModule } from '../status-effect-detail'
import { RouterLink } from '@angular/router'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-attacks',
  templateUrl: './vital-detail-attacks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ScreenshotModule, TooltipModule, StatusEffectDetailModule, RouterLink],
  host: {
    class: 'block',
  },
})
export class VitalDetailAttacksComponent {
  private store = inject(VitalDetailStore)
  private db = inject(NwDbService)

  protected tables$ = selectStream(
    {
      vital: this.store.vital$,
      level: this.store.levelData$,
      modifier: this.store.modifier$,
      difficulty: this.store.mutaDifficulty$,
      tables: this.store.damageTables$,
      affixMap: this.db.affixStatsMap,
      effectMap: this.db.statusEffectsMap,
      spellsByDamageMap: this.db.spellsByDamageTable,
      spellsMetaMap: this.db.spellsMetadataMap,
    },
    ({ vital, modifier, level, difficulty, tables, affixMap, effectMap, spellsByDamageMap, spellsMetaMap }) => {
      return tables.map((table) => {
        const name = table.file.replace(/\.xml$/, '').replace(/^.*javelindata_damagetable/, '')
        const tableName = humanize(`${name}_damagetable`).replaceAll(' ', '')
        const spells = Array.from(spellsByDamageMap.get(tableName)?.values() || [])
        return {
          name: name,
          rows: table.rows
            ?.map((row) => {
              const spell = spells.find((it) => eqCaseInsensitive(it.DamageTableRow, row.DamageID))
              const spellMeta = spellsMetaMap.get(spell?.SpellPrefabPath)
              return selectDamageInfo({
                vital,
                level,
                modifier,
                damageTable: row,
                metadata: spellMeta,
                affixMap,
                effectMap,
                difficulty,
              })
            })
            .filter((it) => !!it.Damage || !!it.AoeEffects?.length)
            .sort((a, b) => b.Damage - a.Damage),
        }
      })
    },
  )
}

function selectDamageInfo({
  vital,
  level,
  modifier,
  damageTable,
  difficulty,
  affixMap,
  effectMap,
  metadata,
}: {
  vital: Vitals
  level: Vitalsleveldata
  modifier: Vitalsmodifierdata
  damageTable: Damagetable
  metadata: Spellsmetadata
  difficulty: Mutationdifficulty
  affixMap: Map<string, Affixstats>
  effectMap: Map<string, Statuseffect>
}) {
  const damage = getVitalDamage({
    vital,
    level,
    damageTable,
    difficulty,
    modifier,
  })

  const affix = affixMap.get(damageTable.Affixes)

  const aoeEffectIds = metadata?.AreaStatusEffects || []
  const aoeEffects = aoeEffectIds.map((it) => effectMap.get(it)).filter((it) => !!it)
  if (aoeEffects.length !== aoeEffectIds.length) {
    console.warn(
      'Missing AOE effects',
      aoeEffectIds.filter((it) => !effectMap.get(it)),
    )
  }
  if (aoeEffects.length) {
    console.debug('AOE effects', aoeEffects)
  }
  return {
    DamageID: damageTable.DamageID,
    AttackName: humanize(damageTable.DamageID.replace(/^Attack/, '')),
    AttackType: damageTable.AttackType,
    IsRanged: damageTable.IsRanged,
    Damage: damage,
    Primary: {
      Type: damageTable.DamageType ? `${damageTable.DamageType}_DamageName` : '',
      Icon: damageTypeIcon(damageTable.DamageType),
      Value: damage * (1 - (affix?.DamagePercentage || 0)),
      Percent: 1 - (affix?.DamagePercentage || 0),
    },
    Secondary: affix?.DamagePercentage
      ? {
          Type: `${affix.DamageType}_DamageName`,
          Icon: damageTypeIcon(affix.DamageType),
          Value: damage * affix.DamagePercentage,
          Percent: affix.DamagePercentage,
        }
      : null,
    AoeEffects: aoeEffects.map((it) => {
      return {
        StatusID: it.StatusID,
        Icon: it.PlaceholderIcon || damageTypeIcon(it.DamageType) || NW_FALLBACK_ICON,
        Label: it.DisplayName || humanize(it.StatusID),
      }
    }),
  }
}
