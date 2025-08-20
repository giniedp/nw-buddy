import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { getVitalDamage, NW_FALLBACK_ICON } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import {
  DamageData,
  DATASHEETS,
  MutationDifficultyStaticData,
  ScannedVital,
  SpellData,
  VitalsBaseData as VitalsData,
  VitalsLevelData,
  VitalsModifierData,
} from '@nw-data/generated'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { damageTypeIcon } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgInfoCircle } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { apiResource, eqCaseInsensitive, humanize } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { StatusEffectDetailModule } from '../status-effect-detail'
import { VitalDetailStore } from './vital-detail.store'

@Component({
  selector: 'nwb-vital-detail-attacks',
  templateUrl: './vital-detail-attacks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, ScreenshotModule, TooltipModule, StatusEffectDetailModule, RouterLink],
  host: {
    class: 'block relative',
  },
})
export class VitalDetailAttacksComponent {
  private db = injectNwData()
  private store = inject(VitalDetailStore)

  protected get swapStatus() {
    return this.resource.status()
  }
  protected resource = apiResource({
    request: () => {
      return {
        vital: this.store.vital(),
        levelData: this.store.levelData(),
        modifier: this.store.modifier(),
        difficulty: this.store.mutaDifficulty(),
        meta: this.store.metadata(),
      }
    },
    loader: async ({ request: { vital, levelData, meta, modifier, difficulty } }) => {
      if (!vital) {
        return undefined
      }
      const tableNames = selectVitalDamageTableNames(vital.VitalsID, meta)
      return loadVitalDamageTableInfos(this.db, {
        vital,
        level: levelData,
        modifier,
        difficulty,
        tableNames,
      })
    },
  })
  protected tables = this.resource.value
  protected isLoading = computed(() => this.store.isLoading() || this.resource.isLoading())
  protected isLoaded = computed(() => this.store.isLoaded() && this.resource.isLoaded())
  protected hasError = this.resource.hasError
  protected errorIcon = svgCircleExclamation
  protected infoIcon = svgInfoCircle
}

function selectVitalDamageTableNames(id: string, meta: ScannedVital) {
  let tables = meta?.tables || []
  // TODO: fix this in the pipeline
  if (eqCaseInsensitive(id, 'Isabella_DG_ShatterMtn_Phase2_00')) {
    tables = tables.filter((it) => it.toLowerCase().includes('phase2'))
  }
  if (eqCaseInsensitive(id, 'Dryad_Siren')) {
    tables = tables.filter((it) => it.toLowerCase().includes('dryad_siren'))
  }
  return tables
}

export interface DamageTableFile {
  name: string
  rows: DamageData[]
}

async function loadVitalDamageTables(db: NwData, files: string[]): Promise<Array<DamageTableFile>> {
  if (!files?.length) {
    return []
  }
  const tables = Object.entries(DATASHEETS.DamageData)
  const rows = files
    .map((file) => {
      file = 'datatables/' + file.replace(/\\/g, '/').replace(/\.xml$/, '.json')
      return tables.find(([_, url]) => {
        if (typeof url.uri === 'string') {
          return eqCaseInsensitive(url.uri, file)
        }
        return url.uri.some((it) => eqCaseInsensitive(it, file))
      })
    })
    .filter((it) => !!it)
    .map(async ([name, uri]) => {
      return {
        name,
        rows: await db.loadDatasheet(uri),
      }
    })
  return Promise.all(rows)
}

async function loadVitalDamageTableInfos(
  db: NwData,
  {
    vital,
    level,
    modifier,
    difficulty,
    tableNames,
  }: {
    vital: VitalsData
    level: VitalsLevelData
    modifier: VitalsModifierData
    difficulty: MutationDifficultyStaticData
    tableNames: string[]
  },
) {
  const tables = await loadVitalDamageTables(db, tableNames)
  return Promise.all(
    tables.map(async (table) => {
      const spells = (await db.spellsByDamageTable(table.name)) || []
      return {
        id: table.name.toLowerCase(),
        name: table.name.replace(/DamageTable$/, ''),
        rows: await Promise.all(
          (table.rows || []).map(async (row) => {
            return loadDamageInfo(db, {
              vital,
              level,
              modifier,
              damageTable: row,
              spell: spells.find((it) => eqCaseInsensitive(it.DamageTableRow, row.DamageID)),
              difficulty,
            })
          }),
        ).then((it) => {
          return it.filter((it) => !!it.Damage || !!it.AoeEffects?.length).sort((a, b) => b.Damage - a.Damage)
        }),
      }
    }),
  )
}

async function loadDamageInfo(
  db: NwData,
  {
    vital,
    level,
    modifier,
    damageTable,
    difficulty,
    spell,
  }: {
    vital: VitalsData
    level: VitalsLevelData
    modifier: VitalsModifierData
    damageTable: DamageData
    difficulty: MutationDifficultyStaticData
    spell: SpellData
  },
) {
  const damage = getVitalDamage({
    vital,
    level,
    damageTable,
    difficulty,
    modifier,
  })

  const affix = await db.affixStatsById(damageTable.Affixes)
  const metadata = await db.spellsMetadataByPrefabPath(spell?.SpellPrefabPath)
  const aoeEffectIds = metadata?.AreaStatusEffects || []
  const aoeEffects = (await Promise.all(aoeEffectIds.map((it) => db.statusEffectsById(it)))).filter((it) => !!it)
  if (aoeEffects.length !== aoeEffectIds.length) {
    console.warn(
      'Missing AOE effects',
      aoeEffectIds.filter((id) => aoeEffects.every((it) => !eqCaseInsensitive(id, it.StatusID))),
    )
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
