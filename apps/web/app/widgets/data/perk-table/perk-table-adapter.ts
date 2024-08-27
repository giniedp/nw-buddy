import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { PerkBucketEntry, isPerkGenerated, isPerkInherent } from '@nw-data/common'
import { COLS_AFFIXSTATDATA, COLS_PERKDATA, PerkData } from '@nw-data/generated'
import { Observable } from 'rxjs'
import { NwDataService } from '~/data'

import { NwTextContextService } from '~/nw/expression'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import { PerkGridCellComponent } from './perk-grid-cell.component'
import {
  PerkTableRecord,
  perkColDescription,
  perkColExcludeItemClass,
  perkColExclusiveLabels,
  perkColIcon,
  perkColId,
  perkColIsStackableAbility,
  perkColItemClass,
  perkColName,
  perkColPerkType,
  perkCraftMod,
} from './perk-table-cols'

@Injectable()
export class PerkTableAdapter implements DataViewAdapter<PerkTableRecord> {
  private db = inject(NwDataService)
  private ctx = inject(NwTextContextService)
  private utils: TableGridUtils<PerkTableRecord> = inject(TableGridUtils)
  private config = injectDataViewAdapterOptions<PerkTableRecord>({ optional: true })
  private source$: Observable<PerkTableRecord[]> = selectStream(
    {
      perks: this.config?.source || this.db.perks,
      affixstats: this.db.affixStatsMap,
      abilities: this.db.abilitiesMap,
      itemsMap: this.db.itemsMap,
      perkBucketsByPerkIdMap: this.db.perkBucketsByPerkIdMap,
      resourcesByPerkBucket: this.db.resourcesByPerkBucketIdMap,
    },
    ({ perks, affixstats, abilities, itemsMap, perkBucketsByPerkIdMap, resourcesByPerkBucket }) => {
      perks = perks.map((it): PerkTableRecord => {
        const buckets = perkBucketsByPerkIdMap.get(it.PerkID)
        const resources = buckets
          ?.map((it) => resourcesByPerkBucket.get(it.PerkBucketID))
          .flat()
          .filter((it) => !!it)
        const items = resources?.map((it) => itemsMap.get(it.ResourceID)).filter((it) => !!it)
        return {
          ...it,
          $affix: affixstats.get(it.Affix),
          $ability: abilities.get(it.EquipAbility?.[0]),
          $items: items,
        }
      })
      if (this.config?.filter) {
        perks = perks.filter(this.config.filter)
      }
      if (this.config?.sort) {
        perks = [...perks].sort(this.config.sort)
      }
      return perks
    },
  )
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

export function buildPerkTableOptions(util: TableGridUtils<PerkTableRecord>, ctx: NwTextContextService) {
  const result: GridOptions<PerkTableRecord> = {
    columnDefs: [
      perkColIcon(util),
      perkColId(util),
      perkColName(util),
      perkColDescription(util, ctx),
      perkColPerkType(util),
      perkCraftMod(util),
      perkColItemClass(util),
      perkColExclusiveLabels(util),
      perkColExcludeItemClass(util),
      perkColIsStackableAbility(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_PERKDATA,
  })
  addGenericColumns(result, {
    props: COLS_AFFIXSTATDATA,
    scope: '$affix',
  })
  return result
}

export function buildPerkTablePickerOptions(util: TableGridUtils<PerkTableRecord>, ctx: NwTextContextService) {
  const result: GridOptions<PerkTableRecord> = {
    columnDefs: [
      perkColIcon(util),
      perkColId(util),
      perkColName(util),
      perkColDescription(util, ctx),
      perkColItemClass(util),
      // perkColExclusiveLabels(util),
      // perkColExcludeItemClass(util),
      // perkColPerkType(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_PERKDATA,
  })
  addGenericColumns(result, {
    props: COLS_AFFIXSTATDATA,
    scope: '$affix',
  })
  return result
}

function findResourceItem(perk: PerkData, buckets: PerkBucketEntry[]) {}
