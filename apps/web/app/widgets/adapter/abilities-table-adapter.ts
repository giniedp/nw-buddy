import { Injectable } from '@angular/core'
import { Ability } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, map, Observable, of, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { nwdbLinkUrl, NwDbService, NwExpressionService } from '~/nw'
import { getWeaponTagLabel } from "~/nw/utils"
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { shareReplayRefCount } from '~/utils'

@Injectable()
export class AbilitiesTableAdapter extends DataTableAdapter<Ability> {
  public static provider() {
    return dataTableProvider({
      adapter: AbilitiesTableAdapter,
    })
  }

  public entityID(item: Ability): string {
    return item.AbilityID
  }

  public entityCategory(item: Ability): DataTableCategory {
    if (!item.WeaponTag) {
      return null
    }
    return {
      value: item.WeaponTag,
      label: this.i18n.get(getWeaponTagLabel(item.WeaponTag)),
      icon: ''
    }
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: nwdbLinkUrl('ability', data.AbilityID),
              target: '_blank',
              icon: data.Icon,
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1']
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 250,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DisplayName)),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'abilityId',
          headerValueGetter: () => 'Ability ID',
          field: this.fieldName('AbilityID'),
          hide: true,
        }),
        this.colDef({
          colId: 'description',
          headerValueGetter: () => 'Description',
          field: this.fieldName('Description'),
          width: 400,
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic'],
          filterValueGetter: ({ data }) => this.i18n.get(data.Description),
          cellRenderer: this.cellRendererAsync(),
          cellRendererParams: this.cellRendererAsyncParams<string>({
            update: (el, text) => {
              el.innerHTML = text
            },
            source: ({ data, value }) => {
              return this.i18n.observe(data.Description).pipe(switchMap((v) => {
                return this.expr
                .solve({
                  text: v,
                  charLevel: 60,
                  itemId: data.AbilityID,
                  gearScore: 600,
                })
              }))
                .pipe(map((it) => it.replace(/\\n/gi, '<br>')))
            },
          }),
        }),
        this.colDef({
          colId: 'weaponTag',
          headerValueGetter: () => 'Weapon Tag',
          field: this.fieldName('WeaponTag'),
          valueFormatter: ({ value }) => this.i18n.get(getWeaponTagLabel(value)),
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'attackType',
          headerValueGetter: () => 'Attack Type',
          field: this.fieldName('AttackType'),
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'uiCategory',
          headerValueGetter: () => 'UI Category',
          field: this.fieldName('UICategory'),
          filter: SelectboxFilter,
        }),
      ],
    })
  )

  public entities: Observable<Ability[]> = defer(() => {
    return this.db.abilities
  })
    .pipe(map((list) => list.filter((it) => !!it.WeaponTag && !!it.DisplayName && !!it.Description)))
    .pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService, private i18n: TranslateService, private expr: NwExpressionService) {
    super()
  }
}
