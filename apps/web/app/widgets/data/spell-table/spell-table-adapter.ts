import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_SPELLDATA } from '@nw-data/generated'
import { defer } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize, selectStream } from '~/utils'
import {
  SpellTableRecord,
  spellColAbilityID,
  spellColBaseDamage,
  spellColDamageTable,
  spellColDamageTableRow,
  spellColDamageType,
  spellColDuration,
  spellColIcon,
  spellColSource,
  spellColSpellID,
  spellColSpellTypes,
  spellColStatusEffectDuration,
  spellColStatusEffects,
  spellColUseStatusEffectDuration,
} from './spell-table-cols'

@Injectable()
export class SpellTableAdapter implements DataViewAdapter<SpellTableRecord> {
  private db = injectNwData()
  private utils: TableGridUtils<SpellTableRecord> = inject(TableGridUtils)
  private config = injectDataViewAdapterOptions<SpellTableRecord>({ optional: true })

  public entityID(item: SpellTableRecord): string {
    return item.SpellID.toLowerCase()
  }

  public entityCategories(item: SpellTableRecord): DataTableCategory[] {
    const source = (item['$source'] as string)?.replace('SpellDataTable', '')
    if (!source) {
      return null
    }
    return [
      {
        id: source.toLowerCase(),
        label: humanize(source),
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<SpellTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<SpellTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildStatusEffectTableOptions(this.utils)
  }

  public connect() {
    return this.source$
  }

  protected source$ = selectStream(this.config?.source || defer(() => this.db.spellsAll()), (list) => {
    if (this.config?.filter) {
      list = list.filter(this.config.filter)
    }
    if (this.config?.sort) {
      list = [...list].sort(this.config.sort)
    }
    return list
  })
}

function buildStatusEffectTableOptions(util: TableGridUtils<SpellTableRecord>) {
  const result: GridOptions<SpellTableRecord> = {
    columnDefs: [
      spellColIcon(util),
      spellColSpellID(util),
      spellColSource(util),
      spellColAbilityID(util),
      spellColBaseDamage(util),
      spellColDamageTable(util),
      spellColDamageTableRow(util),
      spellColDamageType(util),
      spellColDuration(util),
      spellColSpellTypes(util),
      spellColStatusEffects(util),
      spellColStatusEffectDuration(util),
      spellColUseStatusEffectDuration(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_SPELLDATA,
    defaults: { hide: true },
  })
  return result
}
