import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_GATHERABLEDATA } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { TableGridUtils } from '~/ui/data/table-grid'

import { Observable } from 'rxjs'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import { GatherableService } from '../gatherable'
import {
  GatherableTableRecord,
  gatherableColExpansion,
  gatherableColGatherTime,
  gatherableColID,
  gatherableColIcon,
  gatherableColLootTable,
  gatherableColLootTableCount,
  gatherableColMaxRespawnTime,
  gatherableColMinRespawnTime,
  gatherableColName,
  gatherableColSpawnCount,
  gatherableColTradeSkill,
  gatherableColVariationCount,
  gatherableColVariations,
} from './gatherable-table-cols'

@Injectable()
export class GatherableTableAdapter implements DataViewAdapter<GatherableTableRecord> {
  private service = inject(GatherableService)
  private i18n = inject(TranslateService)
  private config = injectDataViewAdapterOptions<GatherableTableRecord>({ optional: true })
  private utils: TableGridUtils<GatherableTableRecord> = inject(TableGridUtils)

  public entityID(item: GatherableTableRecord): string {
    return item.GatherableID.toLowerCase()
  }

  public entityCategories(item: GatherableTableRecord): DataTableCategory[] {
    if (!item.Tradeskill) {
      return null
    }
    return [
      {
        id: item.Tradeskill.toLowerCase(),
        label: item.Tradeskill,
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<GatherableTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<GatherableTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildCommonGatherableGridOptions(this.utils)
  }

  public connect() {
    return this.source$
  }

  private source$: Observable<GatherableTableRecord[]> = selectStream(
    {
      items: this.config?.source || this.service.gatherables$,
    },
    ({ items }) => {
      let records = items
      const filter = this.config?.filter
      if (filter) {
        records = records.filter(filter)
      }
      const sort = this.config?.sort
      if (sort) {
        records = [...records].sort(sort)
      }
      return records
    },
  )
}

export function buildCommonGatherableGridOptions(util: TableGridUtils<GatherableTableRecord>) {
  const result: GridOptions<GatherableTableRecord> = {
    columnDefs: [
      gatherableColIcon(util),
      gatherableColName(util),
      gatherableColID(util),
      gatherableColTradeSkill(util),
      gatherableColGatherTime(util),
      gatherableColMinRespawnTime(util),
      gatherableColMaxRespawnTime(util),
      gatherableColLootTable(util),
      gatherableColLootTableCount(util),
      gatherableColExpansion(util),
      gatherableColSpawnCount(util),
      gatherableColVariationCount(util),
      gatherableColVariations(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_GATHERABLEDATA,
  })
  return result
}
