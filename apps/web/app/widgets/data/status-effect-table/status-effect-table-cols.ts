import { NW_FALLBACK_ICON } from '@nw-data/common'
import { COLS_STATUSEFFECT, Statuseffect } from '@nw-data/generated'
import { sanitizeHtml } from '~/nw'
import { SelectFilter } from '~/ui/data/ag-grid'
import { ExpressionFilter } from '~/ui/data/ag-grid/expression-filter'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type StatusEffectTableUtils = TableGridUtils<StatusEffectTableRecord>
export type StatusEffectTableRecord = Statuseffect

export function statusEffectColIcon(util: StatusEffectTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: ExpressionFilter,
    filterParams: ExpressionFilter.params({
      fields: Object.keys(COLS_STATUSEFFECT),
    }),
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: { target: '_blank', href: util.tipLink('perk', String(data.StatusID)) },
        },
        util.elPicture(
          {
            class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
          },
          util.elImg({
            src: data.PlaceholderIcon || data['IconPath'] || NW_FALLBACK_ICON,
          })
        )
      )
    }),
  })
}
export function statusEffectColStatusID(util: StatusEffectTableUtils) {
  return util.colDef({
    colId: 'statusID',
    hide: true,
    headerValueGetter: () => 'Status ID',
    valueGetter: util.fieldGetter('StatusID'),
  })
}
export function statusEffectColSource(util: StatusEffectTableUtils) {
  return util.colDef({
    colId: 'source',
    hide: true,
    headerValueGetter: () => 'Source',
    valueGetter: util.fieldGetter('$source' as any),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function statusEffectColName(util: StatusEffectTableUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    headerName: 'Name',
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.DisplayName) || data.StatusID),
    width: 300,
  })
}
export function statusEffectColDescription(util: StatusEffectTableUtils) {
  return util.colDef({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 300,
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
    valueGetter: ({ data }) => util.i18n.get(data.Description),
    cellRenderer: util.cellRendererAsync(),
    cellRendererParams: util.cellRendererAsyncParams<string>({
      source: ({ data, value }) =>
        util.expr.solve({
          text: value,
          charLevel: 60,
          itemId: data.Description,
          gearScore: 600,
        }),
      update: (el, text) => {
        el.innerHTML = sanitizeHtml(util.lineBreaksToHtml(text))
      },
    }),
  })
}
export function statusEffectColBaseDuration(util: StatusEffectTableUtils) {
  return util.colDef({
    colId: 'baseDuration',
    headerValueGetter: () => 'Duration',
    field: util.fieldName('BaseDuration'),
  })
}
export function statusEffectColEffectCategories(util: StatusEffectTableUtils) {
  return util.colDef({
    colId: 'effectCategories',
    autoHeight: true,
    headerValueGetter: () => 'Effect Categories',
    valueGetter: util.fieldGetter('EffectCategories'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
