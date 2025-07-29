import { NW_FALLBACK_ICON } from '@nw-data/common'
import { COLS_STATUSEFFECTDATA, StatusEffectData } from '@nw-data/generated'
import { ExpressionFilter } from '~/ui/data/ag-grid/expression-filter'
import { TableGridUtils, colDefPrecision } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type StatusEffectTableUtils = TableGridUtils<StatusEffectTableRecord>
export type StatusEffectTableRecord = StatusEffectData

export function statusEffectColIcon(util: StatusEffectTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: ExpressionFilter,
    filterParams: ExpressionFilter.params({
      fields: Object.keys(COLS_STATUSEFFECTDATA),
    }),
    pinned: true,
    width: 62,
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: { target: '_blank', href: util.tipLink('perk', String(data.StatusID)) },
        },
        util.elPicture(
          {
            class: [
              'transition-all',
              'translate-x-0',
              'hover:translate-x-1',
              'nw-status-bg',
              data.IsNegative ? 'negative' : null,
            ],
          },
          util.elImg({
            src: data.PlaceholderIcon || data['IconPath'] || NW_FALLBACK_ICON,
          }),
        ),
      )
    }),
  })
}
export function statusEffectColStatusID(util: StatusEffectTableUtils) {
  return util.colDef<string>({
    colId: 'statusID',
    hide: true,
    headerValueGetter: () => 'Status ID',
    field: 'StatusID',
  })
}
export function statusEffectColSource(util: StatusEffectTableUtils) {
  return util.colDef<string>({
    colId: 'source',
    headerClass: 'bg-secondary/15',
    hide: true,
    headerValueGetter: () => 'Source',
    valueGetter: ({ data }) => data['$source'],
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function statusEffectColName(util: StatusEffectTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    headerName: 'Name',
    valueGetter: ({ data }) => {
      if (data.DisplayName) {
        return util.i18n.get(data.DisplayName)
      }
      return data.StatusID
    },
    cellClass: ({ data, value }) => {
      if (data.DisplayName && data.DisplayName !== value) {
        return null
      }
      return ['font-mono', 'text-neutral-content/50']
    },
    width: 300,
  })
}
export function statusEffectColDescription(util: StatusEffectTableUtils) {
  return util.colDef<string>({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 300,
    wrapText: true,
    autoHeight: true,

    valueGetter: ({ data }) => {
      if (data.Description) {
        return util.i18n.get(data.Description)
      }
      if (data.StatusID.startsWith('Mut_')) {
        const key = `${data.StatusID}_Tooltip`
        const value = util.i18n.get(key)
        if (key !== value) {
          return value
        }
      }
      return null
    },
    cellClass: ({ data, value }) => {
      if (data.Description && data.Description !== value) {
        return ['multiline-cell', 'text-nw-description', 'italic', 'py-2']
      }
      return ['font-mono', 'text-neutral-content/50']
    },
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
        el.innerHTML = util.nwHtml.sanitize(util.lineBreaksToHtml(text))
      },
    }),
  })
}
export function statusEffectColBaseDuration(util: StatusEffectTableUtils) {
  return util.colDef<number>({
    colId: 'baseDuration',
    headerValueGetter: () => 'Duration',
    getQuickFilterText: () => '',
    field: 'BaseDuration',
    ...(colDefPrecision as any),
  })
}
export function statusEffectColEffectCategories(util: StatusEffectTableUtils) {
  return util.colDef<string[]>({
    colId: 'effectCategories',
    autoHeight: true,
    headerValueGetter: () => 'Effect Categories',
    field: 'EffectCategories',
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
