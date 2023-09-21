import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { isPerkGenerated, isPerkInherent } from '@nw-data/common'
import { COLS_AFFIXSTATS, COLS_PERKS } from '@nw-data/generated'
import { Observable, combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'

import { NwTextContextService } from '~/nw/expression'
import { DATA_TABLE_SOURCE_OPTIONS, DataGridAdapter, DataTableSourceOptions, DataTableUtils } from '~/ui/data-grid'
import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import { DataViewAdapter } from '~/ui/data-view'
import { VirtualGridOptions } from '~/ui/virtual-grid'
import { shareReplayRefCount } from '~/utils'
import { PerkGridCellComponent } from './perk-grid-cell.component'
import {
  PerkTableRecord,
  perkColDescription,
  perkColExcludeItemClass,
  perkColExclusiveLabels,
  perkColIcon,
  perkColIsStackableAbility,
  perkColItemClass,
  perkColName,
  perkColPerkType,
} from './perk-table-cols'

@Injectable()
export class PerkTableAdapter implements DataGridAdapter<PerkTableRecord>, DataViewAdapter<PerkTableRecord> {
  private db = inject(NwDbService)
  private ctx = inject(NwTextContextService)
  private utils: DataTableUtils<PerkTableRecord> = inject(DataTableUtils)
  private config: DataTableSourceOptions<PerkTableRecord> = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private source$: Observable<PerkTableRecord[]> = combineLatest({
    perks: this.config?.source || this.db.perks,
    affixstats: this.db.affixstatsMap,
    abilities: this.db.abilitiesMap,
  })
    .pipe(
      map(({ perks, affixstats, abilities }) => {
        return perks.map((it): PerkTableRecord => {
          return {
            ...it,
            $affix: affixstats.get(it.Affix),
            $ability: abilities.get(it.EquipAbility?.[0]),
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  public entityID(item: PerkTableRecord): string {
    return item.PerkID
  }

  public entityCategories(item: PerkTableRecord): DataTableCategory[] {
    return [
      {
        icon: null,
        label: isPerkInherent(item) ? 'Attributes' : isPerkGenerated(item) ? 'Perks' : item.PerkType,
        id: item.PerkType,
      },
    ]
  }

  public gridOptions(): GridOptions<PerkTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildPerkTableOptions(this.utils, this.ctx)
  }

  public virtualOptions(): VirtualGridOptions<PerkTableRecord> {
    return PerkGridCellComponent.buildGridOptions()
  }

  public connect() {
    return this.source$
  }
}

export function buildPerkTableOptions(util: DataTableUtils<PerkTableRecord>, ctx: NwTextContextService) {
  const result: GridOptions<PerkTableRecord> = {
    columnDefs: [
      perkColIcon(util),
      perkColName(util),
      perkColDescription(util, ctx),
      perkColPerkType(util),
      perkColItemClass(util),
      perkColExclusiveLabels(util),
      perkColExcludeItemClass(util),
      perkColIsStackableAbility(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_PERKS,
  })
  addGenericColumns(result, {
    props: COLS_AFFIXSTATS,
    scope: '$affix',
  })
  return result
}

export function buildPerkTablePickerOptions(util: DataTableUtils<PerkTableRecord>, ctx: NwTextContextService) {
  const result: GridOptions<PerkTableRecord> = {
    columnDefs: [
      perkColIcon(util),
      perkColName(util),
      perkColDescription(util, ctx),
      perkColItemClass(util),
      // perkColExclusiveLabels(util),
      // perkColExcludeItemClass(util),
      // perkColPerkType(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_PERKS,
  })
  addGenericColumns(result, {
    props: COLS_AFFIXSTATS,
    scope: '$affix',
  })
  return result
}
