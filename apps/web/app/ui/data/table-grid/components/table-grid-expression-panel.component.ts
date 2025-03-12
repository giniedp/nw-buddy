import { CommonModule } from '@angular/common'
import { Component, Input, ViewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import { Observable, asyncScheduler, debounceTime, skip, startWith, subscribeOn, switchMap } from 'rxjs'
import {
  ExpressionGroup,
  ExpressionNode,
  ExpressionTreeEditorComponent,
  ExpressionTreeModule,
} from '~/ui/expression-tree'
import { humanize } from '~/utils'
import { AgGrid, fromGridEvent } from '../../ag-grid'
import { ExpressionFilter } from '../../ag-grid/expression-filter'

@Component({
  selector: 'nwb-table-grid-expression-panel',
  templateUrl: './table-grid-expression-panel.component.html',
  imports: [CommonModule, ExpressionTreeModule, FormsModule],
  host: {
    class: 'flex flex-col gap-3 p-2',
  },
})
export class TableGridExpressionPanelComponent extends ComponentStore<{
  grid: AgGrid<any>
  knownFields: Array<{ id: string; isPath: boolean; label: string }>
  expression: ExpressionNode
}> {
  @Input()
  public set grid(value: AgGrid) {
    this.patchState({ grid: value })
  }

  private grid$ = this.select(({ grid }) => grid)
  protected knownFields$ = this.select(({ knownFields }) => knownFields)
  protected expression$: Observable<ExpressionGroup> = this.select(({ expression }) => expression as any, {
    debounce: true,
  })

  @ViewChild(ExpressionTreeEditorComponent, { static: true })
  protected editor: ExpressionTreeEditorComponent

  public constructor() {
    super({
      grid: null,
      knownFields: [],
      expression: null,
    })

    this.grid$
      .pipe(switchMap((grid) => fromGridEvent(grid, 'filterChanged').pipe(startWith(grid))))
      .pipe(subscribeOn(asyncScheduler))
      .pipe(takeUntilDestroyed())
      .subscribe((grid) => {
        const model = getColumnWithFilter(grid)?.filter?.getModel()
        this.patchState({
          knownFields: getKnownFields(grid),
          expression: model,
        })
      })

    this.expression$
      .pipe(skip(1))
      .pipe(debounceTime(500))
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.onExpressionChanged(value)
      })
  }

  protected onExpressionChanged(model: ExpressionNode) {
    const grid = this.get(({ grid }) => grid)
    const filter = getColumnWithFilter(grid)?.filter
    if (!filter) {
      return
    }
    const wasActive = filter.isFilterActive()
    filter.setModel(model)
    if (wasActive || filter.isFilterActive()) {
      grid.api.onFilterChanged('api')
    }
  }
}

function getColumnWithFilter(grid: AgGrid) {
  if (!grid) {
    return null
  }
  for (const col of grid.api.getColumns()) {
    const instance = grid.api.getFilterInstance(col.getColId())
    if (instance instanceof ExpressionFilter) {
      return {
        column: col,
        filter: instance,
      }
    }
  }
  return null
}

function getKnownFields(grid: AgGrid) {
  const found = getColumnWithFilter(grid)
  const knowFields = found?.filter?.knownFields || []
  const knowPaths = found?.filter?.knownPaths || []
  return [
    ...knowFields.map((field) => {
      return {
        id: field,
        isPath: false,
        label: humanize(field),
      }
    }),
    ...knowPaths.map((field) => {
      return {
        id: field,
        isPath: true,
        label: humanize(field),
      }
    }),
  ]
}
