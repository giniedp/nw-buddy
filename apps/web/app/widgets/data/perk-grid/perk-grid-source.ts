import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { isPerkGenerated, isPerkInherent } from '@nw-data/common'
import { COLS_AFFIXSTATS, COLS_PERKS } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'

import { NwExpressionContextService } from '~/nw/expression'
import { ItemPreferencesService } from '~/preferences'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  PerkGridRecord,
  perkColDescription,
  perkColExcludeItemClass,
  perkColExclusiveLabels,
  perkColIcon,
  perkColIsStackableAbility,
  perkColItemClass,
  perkColName,
  perkColPerkType,
} from './perk-grid-cols'

@Injectable()
export class PerkGridSource extends DataGridSource<PerkGridRecord> {
  private db = inject(NwDbService)
  private ctx = inject(NwExpressionContextService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<PerkGridRecord> = inject(DataGridUtils)

  public override entityID(item: PerkGridRecord): string {
    return item.PerkID
  }

  public override entityCategories(item: PerkGridRecord): DataGridCategory[] {
    return [
      {
        icon: null,
        label: isPerkInherent(item) ? 'Attributes' : isPerkGenerated(item) ? 'Perks' : item.PerkType,
        id: item.PerkType,
      },
    ]
  }

  public override buildOptions(): GridOptions<PerkGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils, this.ctx)
  }

  public connect() {
    return combineLatest({
      perks: this.config?.source || this.db.perks,
      affixstats: this.db.affixstatsMap,
    }).pipe(
      map(({ perks, affixstats }) => {
        return perks.map((it) => {
          return {
            ...it,
            $affix: affixstats.get(it.Affix),
          }
        })
      })
    )
  }
}

function buildOptions(util: DataGridUtils<PerkGridRecord>, ctx: NwExpressionContextService) {
  const result: GridOptions<PerkGridRecord> = {
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
