import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { Affixstats, Damagetable, Statuseffect, Vitals, Vitalsleveldata, Vitalsmodifierdata } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { damageTypeIcon } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, selectStream, shareReplayRefCount } from '~/utils'
import { ScreenshotModule } from '../screenshot'
import { VitalDetailStore } from './vital-detail.store'
import { RouterModule } from '@angular/router'

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

  protected iconInfo = svgInfo

  protected tables$ = selectStream(
    combineLatest({
      vital: this.store.vital$,
      vitalLevel: this.store.vitalLevel$,
      vitalCategories: this.store.categories$,
      vitalMod: this.store.vitalModifier$,
      tables: this.store.damageTables$,
      affixMap: this.db.affixstatsMap,
      effectMap: this.db.statusEffectsMap,
    })
  )
    .pipe(
      map(({ vital, vitalMod, vitalLevel, vitalCategories, tables, affixMap, effectMap }) => {
        return tables.map((table) => {
          return {
            name: table.file.replace(/\.xml$/, '').replace(/^.*javelindata_damagetable/, ''),
            rows: table.rows
              ?.map((row) => {
                return selectDamageInfo({
                  vital,
                  vitalLevel,
                  vitalMod,
                  damageTable: row,
                  affixMap,
                  effectMap,
                })
              })
              .filter((it) => !!it.Damage)
              .sort((a, b) => b.Damage - a.Damage),
          }
        })
      })
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
  affixMap,
  effectMap,
}: {
  vital: Vitals
  vitalLevel: Vitalsleveldata
  vitalMod: Vitalsmodifierdata
  damageTable: Damagetable
  affixMap: Map<string, Affixstats>
  effectMap: Map<string, Statuseffect>
}) {
  //
  const baseDamage = vitalLevel.BaseDamage
  const dmgCoef = damageTable.DmgCoef
  const dmgMod = vital?.DamageMod || 1
  const categoryDamageMod = vitalMod?.CategoryDamageMod || 1
  const addDmg = damageTable.AddDmg || 0

  // VitalsLevel.BaseDamage * (1 + AIAbilityTable.BaseDamage - AbilityTable.BaseDamageReduction + (Empower)) * DamageTable.DmgCoef * Vitals.DamageMod * VitalsLevel.CategoryDamageMod + DamageTable.AddDmg
  // TODO: add ability multiplier
  const totalDamage = baseDamage * (1 + 0 - 0 + 0) * dmgCoef * dmgMod * categoryDamageMod + addDmg
  const affix = affixMap.get(damageTable.Affixes)

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
  }
}
