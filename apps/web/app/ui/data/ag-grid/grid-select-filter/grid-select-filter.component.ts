import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { IFilterAngularComp } from '../component-wrapper/interfaces';
import { IAfterGuiAttachedParams, IDoesFilterPassParams, IFilterParams } from '@ag-grid-community/core';
import { GridSelectFilterStore } from './grid-select-filter.store';

@Component({
  standalone: true,
  templateUrl: './grid-select-filter.component.html',
  imports: [CommonModule],
  providers: [GridSelectFilterStore]
})
export class GridSelectFilter<T> implements IFilterAngularComp {

  private store = inject(GridSelectFilterStore)

  filterParams: IFilterParams<T>
  filterText = '';

  public agInit(params: IFilterParams): void {
    this.filterParams = params;
  }

  public doesFilterPass(params: IDoesFilterPassParams) {
    const nodeValue = this.filterParams.getValue(params.node)
    const values = (Array.isArray(nodeValue) ? nodeValue : [nodeValue]).map(valueToId)
    return this.store.doesFilterPass(values as any)
  }

  public isFilterActive(): boolean {
    return this.store.isFilterActive()
  }

  public getModel() {
    if (!this.isFilterActive()) {
      return null;
    }
    return { value: this.store.getModel() };
  }

  public setModel(model: any) {
    this.store.setModel(model?.value)
  }

  public onInputChanged() {
    this.filterParams.filterChangedCallback();
  }

  public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
    if (!params?.suppressFocus) {

    }
  }
}

function valueToId(value: string | number | null) {
  return value ?? JSON.stringify(null)
}
