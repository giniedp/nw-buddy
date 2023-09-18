import { Injectable } from '@angular/core'
import {
  NW_FALLBACK_ICON,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE_BASE,
  getAbilityCategoryTag,
  getWeaponTagLabel,
} from '@nw-data/common'
import { Ability, COLS_ABILITY, Statuseffect } from '@nw-data/generated'
import { ColDef, GridOptions } from '@ag-grid-community/core'
import { sortBy } from 'lodash'
import { Observable, combineLatest, defer, map, of, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService, sanitizeHtml } from '~/nw'
import { NwExpressionService } from '~/nw/expression'
import { NwWeaponType, NwWeaponTypesService } from '~/nw/weapon-types'
import { SelectFilter } from '~/ui/ag-grid'
import { executeTypescript } from '~/ui/code-editor'
import { DataTableAdapter, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

export type AbilityTableItem = Ability & {
  $weaponType: NwWeaponType
  $selfApplyStatusEffect: Statuseffect[]
  $otherApplyStatusEffect: Statuseffect
}

@Injectable()
export class AbilitiesTableAdapter extends DataTableAdapter<AbilityTableItem> {
  public static provider() {
    return dataTableProvider({
      adapter: AbilitiesTableAdapter,
    })
  }

  public entityID(item: AbilityTableItem): string {
    return item.AbilityID
  }

  public entityCategory(item: AbilityTableItem): DataTableCategory {
    if (!item.WeaponTag) {
      return null
    }
    return {
      value: item.WeaponTag,
      label: this.i18n.get(getWeaponTagLabel(item.WeaponTag)),
      icon: item.$weaponType?.IconPathSmall,
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
              href: this.info.link('ability', data.AbilityID),
              target: '_blank',
              icon: data.Icon || NW_FALLBACK_ICON,
              iconClass: [
                'aspect-square',
                'transition-all',
                'translate-x-0',
                'hover:translate-x-1',
                'nw-icon',
                `bg-ability-${getAbilityCategoryTag(data)}`,
                data?.IsActiveAbility ? 'rounded-sm' : 'rounded-full',
                data?.WeaponTag ? 'border' : null,
              ],
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
              el.innerHTML = sanitizeHtml(text)
            },
            source: ({ data, value }) => {
              return this.i18n
                .observe(data.Description)
                .pipe(
                  switchMap((v) => {
                    return this.expr.solve({
                      text: v,
                      charLevel: NW_MAX_CHARACTER_LEVEL,
                      itemId: data.AbilityID,
                      gearScore: NW_MAX_GEAR_SCORE_BASE,
                    })
                  })
                )
                .pipe(map((it) => it.replace(/\\n/gi, '<br>')))
            },
          }),
        }),
        this.colDef({
          colId: 'weaponTag',
          headerValueGetter: () => 'Weapon Tag',
          valueGetter: this.valueGetter(({ data }) => data.WeaponTag),
          valueFormatter: ({ value }) => this.i18n.get(getWeaponTagLabel(value)),
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'source',
          headerValueGetter: () => 'Source',
          valueGetter: this.valueGetter(({ data }) => data['$source']),
          hide: true,
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'attackType',
          headerValueGetter: () => 'Attack Type',
          valueGetter: this.valueGetter(({ data }) => data.AttackType),
          filter: SelectFilter,
          cellRenderer: this.cellRendererTags(humanize),
        }),
        this.colDef({
          colId: 'uiCategory',
          headerValueGetter: () => 'UI Category',
          valueGetter: this.valueGetter(({ data }) => data.UICategory),
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'damageTableRow',
          headerValueGetter: () => 'Damage Table Row',
          valueGetter: this.valueGetter(({ data }) => data.DamageTableRow),
          filter: SelectFilter,
          cellRenderer: this.cellRendererTags(humanize),
        }),
        this.colDef({
          colId: 'damageTableRowOverride',
          headerValueGetter: () => 'Damage Table Row Override',
          valueGetter: this.valueGetter(({ data }) => data.DamageTableRowOverride),
          filter: SelectFilter,
          cellRenderer: this.cellRendererTags(humanize),
        }),
        this.colDef({
          colId: 'remoteDamageTableRow',
          headerValueGetter: () => 'Remote Damage TableRow',
          valueGetter: this.valueGetter(({ data }) => data.RemoteDamageTableRow),
          filter: SelectFilter,
          cellRenderer: this.cellRendererTags(humanize),
        }),
        this.colDef({
          colId: 'afterAction',
          headerValueGetter: () => 'After Action',
          valueGetter: this.valueGetter(({ data }) => data.AfterAction),
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'onAction',
          headerValueGetter: () => 'On Action',
          valueGetter: this.valueGetter(({ data }) => {
            const result = Object.keys(data)
              .filter((it) => it.startsWith('On') && !!data[it])
              .map((it) => humanize(it).split(' '))
              .map((it) => (it[0] === 'On' ? it.slice(1).join('') : null))
              .filter((it) => !!it)
            return result.length ? result : null
          }),
          cellRenderer: this.cellRendererTags(humanize),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
      ],
    }).pipe(map((options) => appendFields(options, Array.from(Object.entries(COLS_ABILITY)))))
  )

  public entities: Observable<AbilityTableItem[]> = defer(() =>
    combineLatest({
      abilities: this.db.abilities,
      effects: this.db.statusEffectsMap,
      weaponTypes: this.weaponTypes.byTag$,
      script: this.scriptFilter$,
    })
  )
    .pipe(
      switchMap(async ({ abilities, effects, weaponTypes, script }) => {
        const result = abilities.map((it): AbilityTableItem => {
          return {
            ...it,
            $weaponType: weaponTypes.get(it.WeaponTag),
            $selfApplyStatusEffect: it.SelfApplyStatusEffect?.map((id) => effects.get(id)),
            $otherApplyStatusEffect: effects.get(it.OtherApplyStatusEffect),
          }
        })

        return this.filterWithScript(result, script).catch((err) => {
          console.error(err)
          return result
        })
      })
    )
    .pipe(map((list) => sortBy(list, (it) => (!!it.WeaponTag && !!it.DisplayName && !!it.Description ? -1 : 1))))
    .pipe(shareReplayRefCount(1))

  public constructor(
    private db: NwDbService,
    private i18n: TranslateService,
    private expr: NwExpressionService,
    private weaponTypes: NwWeaponTypesService,
    private info: NwLinkService
  ) {
    super()
  }

  private async filterWithScript(items: AbilityTableItem[], script: string): Promise<AbilityTableItem[]> {
    if (!script) {
      return items
    }
    const fn: Function = (await executeTypescript(script))['default']
    return fn(items)
  }
}

function appendFields(options: GridOptions, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = options.columnDefs.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      field: field,
      hide: true,
    }
    colDef.filter = SelectFilter
    colDef.filterParams = SelectFilter.params({
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    options.columnDefs.push(colDef)
  }
  return options
}
