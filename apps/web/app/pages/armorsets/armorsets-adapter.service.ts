import { Injectable } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { GridOptions, IDetailCellRendererParams } from 'ag-grid-community'
import { groupBy } from 'lodash'
import { combineLatest, defer, map, Observable, shareReplay } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'
import { CategoryFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { Armorset } from './types'
import { findSets } from './utils'

function fieldName(key: keyof Armorset) {
  return key
}

function field<K extends keyof Armorset>(item: Armorset, key: K): Armorset[K] {
  return item[key]
}

@Injectable()
export class ArmorsetsAdapterService extends DataTableAdapter<Armorset> {
  public entityID(item: Armorset): string {
    return item.key
  }

  public entityCategory(item: Armorset): string {
    return item.source
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return this.nw.gridOptions({
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          headerName: 'Name',
          field: fieldName('name'),
          width: 120,
        },
        {
          headerName: 'Tier',
          width: 60,
          valueGetter: ({ data }) => {
            switch (field(data, 'tier')) {
              case 0:
                return '-'
              case 1:
                return 'I'
              case 2:
                return 'II'
              case 3:
                return 'III'
              case 4:
                return 'IV'
              case 5:
                return 'V'
              default:
                return String(field(data, 'tier'))
            }
          },
          filter: CategoryFilter,
        },
        {
          headerName: 'Weight',
          width: 80,
          field: fieldName('weight'),
          filter: CategoryFilter,
        },
        {
          headerName: 'Pieces',
          children: new Array(5).fill(null).map((_, i) => {
            return {
              children: [
                {
                  sortable: false,
                  filter: false,
                  width: 54,
                  cellRenderer: ({ data }) => {
                    const item = (data as Armorset).items[i]
                    const rarity = this.nw.itemRarity(item)
                    const iconPath = this.nw.iconPath(item.IconPath)
                    const icon = this.nw.renderIcon(iconPath, {
                      size: 38,
                      rarity: rarity,
                    })
                    return `<a href="${this.nw.nwdbLinkUrl('item', item.ItemID)}" target="_blank">${icon}</a>`
                  },
                },
                {
                  width: 80,
                  editable: true,

                  valueGetter: ({ data }) => {
                    const item = (data as Armorset).items[i]
                    return this.nw.itemPref.get(item.ItemID)?.gs
                  },
                  valueSetter: ({ data, newValue }) => {
                    const item = (data as Armorset).items[i]
                    this.nw.itemPref.merge(item.ItemID, { gs: newValue })
                    return true
                  },
                  cellRenderer: ({ data, value }: IDetailCellRendererParams) => {
                    const set = data as Armorset
                    const item = set.items[i]
                    const name = this.nw.translate(item.Name)?.replace(set.name, '')
                    const el = document.createElement('div')
                    el.classList.add('flex', 'flex-col', 'text-sm')
                    el.innerHTML = `
                      <span>${name}</span>
                      <span class="italic gs">${value || '•'}</span>
                    `
                    if (value) {
                      el.querySelector('.gs').classList.add('text-success')
                    } else {
                      el.querySelector('.gs').classList.add('text-error')
                    }
                    return el
                  },
                },
              ],
            }
          }),
        },
      ],
    })
  }

  public entities: Observable<Armorset[]> = defer(() => {
    return combineLatest({
      items: this.nw.db.items,
      perks: this.nw.db.perksMap,
      locale: this.locale.change,
    })
    .pipe(
      map(({ items, perks }) => {
        const MIN_RARITY = 2
        items = items.filter((it) => it.ItemType === 'Armor').filter((it) => this.nw.itemRarity(it) >= MIN_RARITY)
        return Object.entries(groupBy(items, (it) => it['$source']))
          .map(([key, items]) => ({
            key: key,
            sets: findSets(items, key, perks, this.nw),
          }))
          .filter((group) => group.sets.length > 0)
          .map((it) => it.sets)
          .flat(1)
          .map((it) => it.sets)
          .flat(1)
      })
    )
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  public constructor(private nw: NwService, private locale: LocaleService) {
    super()
  }
}
