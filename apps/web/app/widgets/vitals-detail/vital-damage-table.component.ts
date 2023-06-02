import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { getWeaponTagLabel } from '@nw-data/common'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { damageTypeIcon } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, rejectKeys, shareReplayRefCount } from '~/utils'
import { ScreenshotModule } from '../screenshot'
import { VitalDetailStore } from './vital-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-vital-damage-table',
  templateUrl: './vital-damage-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, PropertyGridModule, IconsModule, ItemFrameModule, ScreenshotModule],
  providers: [VitalDetailStore],
  host: {
    class: 'layout-content',
  },
})
export class VitalDamageTableComponent {
  @Input()
  public set vitalId(id: string) {
    this.store.patchState({ vitalId: id })
  }

  protected iconInfo = svgInfo

  protected tables$ = this.store.damageTables$
    .pipe(
      map((tables) => {
        return tables.map((table) => {
          return {
            name: table.file.replace(/\.xml$/, '').replace(/^.*javelindata_damagetable/, ''),
            rows: table.rows
              ?.map((row) => {
                return {
                  Name: humanize(row.DamageID.replace(/^Attack/, '')),
                  DamageTypeName: row.DamageType ? `${row.DamageType}_DamageName` : '',
                  DamageTypeIcon: damageTypeIcon(row.DamageType),
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

  public constructor(private store: VitalDetailStore) {
    //
  }
}
