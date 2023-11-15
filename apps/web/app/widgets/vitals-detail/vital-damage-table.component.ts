import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
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
import { combineLatest, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { damageTypeIcon } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, humanize, selectStream, shareReplayRefCount } from '~/utils'
import { ScreenshotModule } from '../screenshot'
import { VitalDetailStore } from './vital-detail.store'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { StatusEffectDetailModule } from '../data/status-effect-detail'
import { DamageRowDetailModule } from '../data/damage-detail'

@Component({
  standalone: true,
  selector: 'nwb-vital-damage-table',
  templateUrl: './vital-damage-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    TooltipModule,
    PropertyGridModule,
    IconsModule,
    ItemFrameModule,
    ScreenshotModule,
    RouterModule,
    StatusEffectDetailModule,
    DamageRowDetailModule,
  ],
  providers: [VitalDetailStore],
  host: {
    class: 'layout-content',
  },
})
export class VitalDamageTableComponent {
  private db = inject(NwDbService)

  @Input()
  public set vitalId(id: string) {
    this.store.patchState({ vitalId: id })
  }

  @Input()
  public set level(level: number) {
    this.store.patchState({ level: level })
  }

  @Input()
  public set mutaElementId(value: string) {
    //this.store.patchState({ level: level })
  }

  @Input()
  public set mutaDifficulty(value: number) {
    this.store.patchState({ mutaDifficulty: value })
  }

  protected iconInfo = svgInfo
  protected trackByIndex = (index: number) => index
  protected tables$ = selectStream(
    combineLatest({
      vital: this.store.vital$,
      vitalLevel: this.store.vitalLevel$,
      vitalCategories: this.store.categories$,
      vitalMod: this.store.vitalModifier$,
      difficulty: this.store.mutaDifficulty$,
      tables: this.store.damageTables$,
      affixMap: this.db.affixstatsMap,
      effectMap: this.db.statusEffectsMap,
      spellsByDamageMap: this.db.spellsByDamageTable,
      spellsMetaMap: this.db.spellsMetadataMap,
    })
  )
    .pipe(
      map(
        ({
          vital,
          vitalMod,
          vitalLevel,
          vitalCategories,
          difficulty,
          tables,
          affixMap,
          effectMap,
          spellsByDamageMap,
          spellsMetaMap,
        }) => {
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
                    vitalLevel,
                    vitalMod,
                    damageTable: row,
                    spellMeta: spellMeta,
                    affixMap,
                    effectMap,
                    difficulty,
                  })
                })
                .filter((it) => !!it.Damage || !!it.AoeEffects?.length)
                .sort((a, b) => b.Damage - a.Damage),
            }
          })
        }
      )
    )
    .pipe(shareReplayRefCount(1))

  public constructor(private store: VitalDetailStore) {
    //
  }
}

function selectDamageInfo({
  vital,
  vitalLevel,
  vitalMod,
  damageTable,
  difficulty,
  affixMap,
  effectMap,
  spellMeta,
}: {
  vital: Vitals
  vitalLevel: Vitalsleveldata
  vitalMod: Vitalsmodifierdata
  damageTable: Damagetable
  spellMeta: Spellsmetadata
  difficulty: Mutationdifficulty
  affixMap: Map<string, Affixstats>
  effectMap: Map<string, Statuseffect>
}) {
  //
  const baseDamage = vitalLevel.BaseDamage
  const dmgCoef = damageTable.DmgCoef
  const dmgMod = vital?.DamageMod || 1
  const categoryDamageMod = vitalMod?.CategoryDamageMod || 1
  const addDmg = damageTable.AddDmg || 0

  //const dmgIncMod = effectMap.get(difficulty?.DamageIncreaseMod)?.['DMG' + damageTable.DamageType] || 0
  const dmgPotency = 1 + (difficulty?.[`DamagePotency_${vital.CreatureType}`] || 0) / 100

  const totalDamage = baseDamage * dmgCoef * dmgMod * dmgPotency * categoryDamageMod + addDmg

  // VitalsLevel.BaseDamage * (1 + AIAbilityTable.BaseDamage - AbilityTable.BaseDamageReduction + (Empower)) * DamageTable.DmgCoef * Vitals.DamageMod * VitalsLevel.CategoryDamageMod + DamageTable.AddDmg
  const affix = affixMap.get(damageTable.Affixes)

  const aoeEffectIds = spellMeta?.AreaStatusEffects || []
  const aoeEffects = aoeEffectIds.map((it) => effectMap.get(it)).filter((it) => !!it)
  if (aoeEffects.length !== aoeEffectIds.length) {
    console.warn(
      'Missing AOE effects',
      aoeEffectIds.filter((it) => !effectMap.get(it))
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
    Damage: totalDamage,
    Primary: {
      Type: damageTable.DamageType ? `${damageTable.DamageType}_DamageName` : '',
      Icon: damageTypeIcon(damageTable.DamageType),
      Value: totalDamage * (1 - (affix?.DamagePercentage || 0)),
      Percent: 1 - (affix?.DamagePercentage || 0),
    },
    Secondary: affix?.DamagePercentage
      ? {
          Type: `${affix.DamageType}_DamageName`,
          Icon: damageTypeIcon(affix.DamageType),
          Value: totalDamage * affix.DamagePercentage,
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
