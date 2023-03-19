import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Damagetable } from '@nw-data/types'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getWeaponTagLabel } from '~/nw/utils'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, rejectKeys, shareReplayRefCount } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-vital-damage-table',
  templateUrl: './vital-damage-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, PropertyGridModule, IconsModule],
  host: {
    class: 'layout-content',
  },
})
export class VitalDamageTableComponent extends ComponentStore<{ vitalId: string }> {
  @Input()
  public set vitalId(id: string) {
    super.patchState({ vitalId: id })
  }

  protected iconInfo = svgInfo

  protected vitalId$ = this.select(({ vitalId }) => vitalId)
  protected vital$ = this.db.vital(this.vitalId$)
  protected tableFiles$ = this.select(this.vital$, this.db.vitalsMetadataMap, (vital, meta) => {
    let tables = (meta.get(vital.VitalsID)?.tables || [])
    // TODO: fix this in the pipeline
    if (vital.VitalsID === 'Isabella_DG_ShatterMtn_Phase2_00') {
      tables = tables.filter((it) => it.toLowerCase().includes('phase2'))
    }
    if (vital.VitalsID === 'Dryad_Siren') {
      tables = tables.filter((it) => it.toLowerCase().includes('dryad_siren'))
    }
    return tables
  })

  protected tables$ = this.tableFiles$
    .pipe(
      switchMap((files) => {
        if (!files?.length) {
          return of<Array<{ name: string, rows: Damagetable[]}>>([])
        }
        return combineLatest(
          files.map((it) => {
            return this.db.data.load<Damagetable[]>(it.replace(/\.xml$/, '.json')).pipe(
              map((rows) => {
                return {
                  name: it,
                  rows: rows,
                }
              })
            )
          })
        )
      })
    )
    .pipe(
      map((tables) => {
        return tables.map((table) => {
          return {
            name: table.name.replace(/\.xml$/, '').replace(/^.*javelindata_damagetable/, ''),
            rows: table.rows
              ?.map((row) => {
                return {
                  Name: humanize(row.DamageID.replace(/^Attack/, '')),
                  DamageTypeName: row.DamageType ? `${row.DamageType}_DamageName` : '',
                  DamageTypeIcon: this.dmg.damageTypeIcon(row.DamageType),
                  WeaponCategory: getWeaponTagLabel(row.WeaponCategory) || row.WeaponCategory,
                  AttackType: row.AttackType,
                  DmgCoef: row.DmgCoef,
                  Props: rejectKeys(row, (it) => !row[it]),
                }
              })
              .sort((a, b) => b.DmgCoef - a.DmgCoef),
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService, private dmg: NwWeaponTypesService) {
    super({ vitalId: null })
  }
}
