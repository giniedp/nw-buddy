import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_STATUSEFFECT, Statuseffect } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  StatusEffectGridRecord,
  statusEffectColBaseDuration,
  statusEffectColDescription,
  statusEffectColEffectCategories,
  statusEffectColIcon,
  statusEffectColName,
  statusEffectColSource,
  statusEffectColStatusID,
} from './status-effect-grid-cols'

@Injectable()
export class StatusEffectGridSource extends DataGridSource<StatusEffectGridRecord> {
  private db = inject(NwDbService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<StatusEffectGridRecord> = inject(DataGridUtils)

  public override entityID(item: Statuseffect): string {
    return item.StatusID
  }

  public override entityCategories(item: Statuseffect): DataGridCategory[] {
    return [
      {
        id: item['$source'],
        label: item['$source'],
      },
    ]
  }

  public override buildOptions(): GridOptions<StatusEffectGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return (
      this.config?.source ||
      this.db.statusEffects
        .pipe(map((list) => sortBy(list, (it) => it.StatusID)))
        .pipe(map((list) => sortBy(list, (it) => (it.Description ? -1 : 1))))
    )
  }
}

function buildOptions(util: DataGridUtils<StatusEffectGridRecord>) {
  const result: GridOptions<StatusEffectGridRecord> = {
    columnDefs: [
      statusEffectColIcon(util),
      statusEffectColStatusID(util),
      statusEffectColSource(util),
      statusEffectColName(util),
      statusEffectColDescription(util),
      statusEffectColBaseDuration(util),
      statusEffectColEffectCategories(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_STATUSEFFECT,
  })
  return result
}
