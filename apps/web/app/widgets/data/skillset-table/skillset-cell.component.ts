import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostBinding, HostListener, Input, computed, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { SkillBuildsDB } from '~/data'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'

import { NW_FALLBACK_ICON, getAbilityCategoryTag } from '@nw-data/common'
import { Observable, ReplaySubject, combineLatest, map, of, switchMap } from 'rxjs'
import { getWeaponTypeInfo } from '~/nw/weapon-types'
import { selectSignal } from '~/utils'
import { combineLatestOrEmpty } from '~/utils/rx/combine-latest-or-empty'
import { EmptyComponent } from '~/widgets/empty'
import { SkillTreeStore } from '~/widgets/skill-builder/skill-tree.store'
import { SkillsetTableRecord } from './skillset-table-cols'

@Component({
  standalone: true,
  selector: 'nwb-skillset-cell',
  templateUrl: './skillset-cell.component.html',
  styleUrl: './skillset-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule],
  providers: [SkillTreeStore],
  host: {
    class: 'relative flex flex-col rounded-md overflow-clip m-1 h-40 cursor-pointer',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class SkillsetCellComponent implements VirtualGridCellComponent<SkillsetTableRecord> {
  public static buildGridOptions(): VirtualGridOptions<SkillsetTableRecord> {
    return {
      height: 168,
      width: [300, 300],
      cellDataView: SkillsetCellComponent,
      cellEmptyView: EmptyComponent,
    }
  }

  private store = inject(SkillBuildsDB)
  private db = inject(NwDataService)

  private recordId = new ReplaySubject<string>(1)

  private record = selectSignal(
    this.store.observeByid(this.recordId).pipe(
      switchMap((record): Observable<SkillsetTableRecord> => {
        if (!record) {
          return of(null)
        }
        return combineLatest({
          record: of(record),
          abilities: combineLatestOrEmpty(
            [...(record.tree1 || []), ...(record.tree2 || [])].map((it) => this.db.ability(it)),
          ).pipe(map((list) => list.filter((it) => it.IsActiveAbility))),
        })
      }),
    ),
  )

  protected recordName = computed(() => this.record()?.record?.name || '')
  protected abilities = computed(() => {
    const result = (this.record()?.abilities || []).map((it) => {
      return {
        icon: it.Icon || NW_FALLBACK_ICON,
        category: getAbilityCategoryTag(it),
      }
    })
    result.length = Math.max(result.length, 3)
    for (let i = 0; i < result.length; i++) {
      if (!result[i]) {
        result[i] = { icon: NW_FALLBACK_ICON, category: 'none' }
      }
    }
    return result
  })
  protected tags = computed(() => {
    return this.record()?.record?.tags || []
  })
  protected icon = computed(() => {
    const info = getWeaponTypeInfo(this.record()?.record?.weapon)
    return info?.IconPath
  })

  @Input()
  public set data(value: SkillsetTableRecord) {
    this.recordId.next(value.record.id)
  }
  public get data() {
    return this.record()
  }

  @Input()
  @HostBinding('class.is-selected')
  public selected: boolean

  private grid = inject(VirtualGridComponent<SkillsetTableRecord>)

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
