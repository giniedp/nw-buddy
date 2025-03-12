import {
  ColDef,
  IAfterGuiAttachedParams,
  IDoesFilterPassParams,
  IFilterParams,
  IRowNode,
} from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { sortBy } from 'lodash'
import { skip } from 'rxjs'
import { humanize } from '~/utils'
import { IFilterAngularComp } from '../component-wrapper/interfaces'
import { GridSelectFilterStore } from './grid-select-filter.store'
import { GridSelectPanelComponent } from './grid-select-panel.component'
import { GridSelectFilterOption, GridSelectFilterParams } from './types'

@Component({
  template: '<nwb-grid-select-panel/>',
  imports: [CommonModule, FormsModule, GridSelectPanelComponent],
  providers: [GridSelectFilterStore],
  host: {
    class: 'block bg-base-300 border border-base-200 rounded-md w-[300px] overflow-hidden',
  },
})
export class GridSelectFilter<T> implements IFilterAngularComp {
  public static colFilter<T>(params: GridSelectFilterParams<T>): Pick<ColDef<T>, 'filter' | 'filterParams'> {
    return {
      filter: GridSelectFilter,
      filterParams: params,
    }
  }

  private store = inject(GridSelectFilterStore)
  private params: IFilterParams<T> & GridSelectFilterParams<T>

  constructor() {
    toObservable(this.store.model)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => {
        this.params.filterChangedCallback()
      })
  }

  public agInit(params: IFilterParams & GridSelectFilterParams<T>): void {
    this.params = params
    patchState(this.store, {
      search: '',
      searchEnabled: !!params.search,
    })
    this.initOptions()
  }

  public doesFilterPass(params: IDoesFilterPassParams<T>) {
    const nodeValue = this.params.getValue(params.node)
    const values = (Array.isArray(nodeValue) ? nodeValue : [nodeValue]).map(valueToId)
    return this.store.doesFilterPass(values as any, this.params.valueMatcher)
  }

  public isFilterActive(): boolean {
    return this.store.isFilterActive()
  }

  public getModel() {
    if (!this.isFilterActive()) {
      return null
    }
    return { value: this.store.getModel() }
  }

  public setModel(model: any) {
    this.store.setModel(model?.value)
  }

  public onNewRowsLoaded() {
    this.initOptions()
  }

  public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
    if (!params?.suppressFocus) {
    }
  }

  private initOptions() {
    const getter = this.params.getOptions || ((node) => this.extractOptionsFromNode(node))
    const values = new Map<any, GridSelectFilterOption>()
    this.params.api.forEachLeafNode((node) => {
      getter(node).forEach((option) => {
        values.set(option.id, option)
      })
    })
    let result = Array.from(values.values())
    if (this.params.order === 'asc') {
      result = sortBy(result, (it) => it.order ?? it.label)
    } else if (this.params.order === 'desc') {
      result = sortBy(result, (it) => it.order ?? it.label).reverse()
    }
    patchState(this.store, {
      options: result,
    })
  }

  protected extractOptionsFromNode(node: IRowNode): GridSelectFilterOption[] {
    const value = this.getValue(node, node.data)
    if (Array.isArray(value)) {
      return value.map((it) => {
        return {
          id: valueToId(it),
          label: it == null ? '- not set -' : humanize(it),
          class: it == null ? ['italic'] : null,
        }
      })
    }
    return [
      {
        id: valueToId(value),
        label: value == null ? '- not set -' : this.getLabel(node, node.data, value),
        class: value == null ? ['italic'] : null,
      },
    ]
  }
  protected getValue(node: IRowNode, data: any) {
    const result = this.params.valueGetter({
      api: this.params.api,
      colDef: this.params.colDef,
      column: this.params.column,
      columnApi: this.params.columnApi,
      context: this.params.context,
      data: data,
      getValue: (field) => node.data[field],
      node: node,
    })
    return result ?? null
  }

  private getLabel(node: IRowNode, data: any, value: any) {
    const formatter = this.params.colDef.valueFormatter
    if (typeof formatter === 'function') {
      return formatter({
        api: this.params.api,
        colDef: this.params.colDef,
        column: this.params.column,
        columnApi: this.params.columnApi,
        context: this.params.context,
        data: data,
        node: node,
        value: value,
      })
    }
    return humanize(value)
  }
}

function valueToId(value: string | number | null) {
  return value ?? JSON.stringify(null)
}
