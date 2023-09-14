import { Injectable } from '@angular/core'
import { NW_FALLBACK_ICON, getQuestTypeIcon } from '@nw-data/common'
import { COLS_OBJECTIVE, Objective } from '@nw-data/generated'
import { ColDef, GridOptions } from '@ag-grid-community/core'
import { defer, map, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class QuestsTableAdapter extends DataTableAdapter<Objective> {
  public static provider() {
    return dataTableProvider({
      adapter: QuestsTableAdapter,
    })
  }

  public entityID(item: Objective): string | number {
    return item.ObjectiveID
  }

  public entityCategory(item: Objective): DataTableCategory {
    return {
      label: humanize(item.Type),
      value: item.Type,
      icon: getQuestTypeIcon(item.Type) || NW_FALLBACK_ICON,
    }
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
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
              target: '_blank',
              href: this.info.link('quest', String(data.ObjectiveID)),
              icon: getQuestTypeIcon(data.Type) || NW_FALLBACK_ICON,
              iconClass: ['scale-125', 'transition-all', 'translate-x-0', 'hover:translate-x-1'],
              small: true,
            })
          }),
        }),
        this.colDef({
          colId: 'objectiveID',
          headerValueGetter: () => 'ID',
          hide: true,
        }),
        this.colDef({
          colId: 'title',
          headerValueGetter: () => 'Title',
          width: 250,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.Title)),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'description',
          headerValueGetter: () => 'Description',
          width: 350,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.Description)),
          cellRenderer: this.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
        }),
        this.colDef({
          colId: 'playerPrompt',
          headerValueGetter: () => 'Player Prompt',
          width: 350,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.PlayerPrompt)),
          cellRenderer: this.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          hide: true,
        }),
        this.colDef({
          colId: 'objectiveProposalResponse',
          headerValueGetter: () => 'Objective Proposal Response',
          width: 350,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.ObjectiveProposalResponse)),
          cellRenderer: this.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          hide: true,
        }),
        this.colDef({
          colId: 'inProgressResponse',
          headerValueGetter: () => 'In Progress Response',
          width: 350,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.InProgressResponse)),
          cellRenderer: this.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          hide: true,
        }),
        this.colDef({
          colId: 'destinationCompletionAvailablePrompt',
          headerValueGetter: () => 'Destination Completion Available Prompt',
          width: 350,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DestinationCompletionAvailablePrompt)),
          cellRenderer: this.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          hide: true,
        }),
        this.colDef({
          colId: 'destinationCompletionAvailableResponse',
          headerValueGetter: () => 'Destination Completion Available Response',
          width: 350,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DestinationCompletionAvailableResponse)),
          cellRenderer: this.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          hide: true,
        }),

        this.colDef({
          colId: 'difficultyLevel',
          headerValueGetter: () => 'Difficulty Level',
          field: this.fieldName('DifficultyLevel'),
          filter: 'agNumberColumnFilter',
        }),
        this.colDef({
          colId: 'requiredLevel',
          headerValueGetter: () => 'Required Level',
          field: this.fieldName('RequiredLevel'),
          filter: 'agNumberColumnFilter',
          hide: true,
        }),
        this.colDef({
          colId: 'achievementId',
          headerValueGetter: () => 'Achievement Id',
          field: this.fieldName('AchievementId'),
          hide: true,
        }),
        this.colDef({
          colId: 'requiredAchievementId',
          headerValueGetter: () => 'Required Achievement Id',
          field: this.fieldName('RequiredAchievementId'),
          hide: true,
        }),
      ],
    })
  ).pipe(
    map((options) => {
      appendFields(options.columnDefs, Array.from(Object.entries(COLS_OBJECTIVE)))
      return options
    })
  )

  public entities: Observable<Objective[]> = defer(() => {
    return this.db.quests
  }).pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService, private i18n: TranslateService, private info: NwLinkService) {
    super()
  }
}

function appendFields(columns: Array<ColDef>, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = columns.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      valueGetter: ({ data }) => data[field],
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
    columns.push(colDef)
  }
}
