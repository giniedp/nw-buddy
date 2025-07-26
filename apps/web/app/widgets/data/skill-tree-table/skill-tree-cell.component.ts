import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  Input,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core'
import { RouterModule } from '@angular/router'
import { SkillTreeRecord, injectNwData, skillTreeProps } from '~/data'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'

import { rxResource } from '@angular/core/rxjs-interop'
import { NW_FALLBACK_ICON, getAbilityCategoryTag } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { AbilityData } from '@nw-data/generated'
import { Observable, combineLatest, map, of } from 'rxjs'
import { getWeaponTypeInfo } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgGlobe } from '~/ui/icons/svg'
import { SyncBadgeComponent } from '~/ui/sync-badge'
import { combineLatestOrEmpty } from '~/utils/rx/combine-latest-or-empty'
import { EmptyComponent } from '~/widgets/empty'
import { SkillTreeTableRecord } from './skill-tree-table-cols'

@Component({
  selector: 'nwb-skill-tree-cell',
  templateUrl: './skill-tree-cell.component.html',
  styleUrl: './skill-tree-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, IconsModule, SyncBadgeComponent],
  host: {
    class: 'relative flex flex-col rounded-md overflow-clip m-1 h-40 cursor-pointer',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class SkillTreeCellComponent implements VirtualGridCellComponent<SkillTreeTableRecord> {
  public static buildGridOptions(): VirtualGridOptions<SkillTreeTableRecord> {
    return {
      height: 168,
      width: [300, 300],
      cellDataView: SkillTreeCellComponent,
      cellEmptyView: EmptyComponent,
    }
  }

  private db = injectNwData()
  private grid = inject(VirtualGridComponent<SkillTreeTableRecord>)
  private record = signal<SkillTreeRecord>(null)
  private resource = rxResource({
    params: this.record,
    stream: ({ params }) => loadRow(this.db, params),
  })
  private row = signal<SkillTreeTableRecord>(null)

  protected recordName = computed(() => this.record()?.name || '')
  protected abilities = computed(() => selectAbilities(this.row()?.abilities))
  protected tags = computed(() => this.record()?.tags || [])
  protected icon = computed(() => getWeaponTypeInfo(this.record()?.weapon)?.IconPath)
  protected state = skillTreeProps({ skillTree: this.record })
  protected iconGlobe = svgGlobe

  @Input()
  public set data(value: SkillTreeTableRecord) {
    this.record.set(value.record)
  }

  @Input()
  @HostBinding('class.is-selected')
  public selected: boolean

  public constructor() {
    effect(() => {
      if (this.resource.isLoading()) {
        return
      }
      untracked(() => {
        this.row.set(this.resource.hasValue() ? this.resource.value() : null)
      })
    })
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.row(), e)
  }
}

function loadRow(db: NwData, record: SkillTreeRecord): Observable<SkillTreeTableRecord> {
  const abilities = [...(record.tree1 || []), ...(record.tree2 || [])]
  return combineLatest({
    record: of(record),
    abilities: combineLatestOrEmpty(
      abilities.map((it) => {
        return db.abilitiesById(it)
      }),
    ).pipe(
      map((list) => {
        return list.filter((it) => it.IsActiveAbility)
      }),
    ),
  })
}

function selectAbilities(abilities: AbilityData[]) {
  const result = (abilities || []).map((it) => {
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
}
