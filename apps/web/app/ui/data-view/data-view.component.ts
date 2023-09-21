import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { DataGridComponent } from '../data-grid'
import { VirtualGridComponent } from '../virtual-grid'
import { DataViewStore } from './data-view.sotre'

@Component({
  standalone: true,
  selector: 'nwb-data-view',
  template: `
    <ng-container *ngIf="store.activeView$() === 'grid'">
      <nwb-data-grid
        [source]="store.gridSource$ | async"
        [selection]="store.selectedItemIds$ | async"
        (selectionChange)="store.patchState({ selectedItems: $event })"
      ></nwb-data-grid>
    </ng-container>

    <ng-container *ngIf="store.activeView$() === 'virtual'">
      <!-- <nwb-virtual-grid
        [data]="store.data$ | async"
        [options]="store.virtualOption$ | async"
        [selection]="store.selectedItemIds$ | async"
        (selectionChange)="store.patchState({ selectedItems: $event })"
      ></nwb-virtual-grid> -->
    </ng-container>
  `,
  host: {
    class: 'flex-1 h-full w-full flex flex-col',
  },
  imports: [CommonModule, DataGridComponent, VirtualGridComponent],
  providers: [DataViewStore],
})
export class DataViewComponent {
  public constructor(protected store: DataViewStore) {
    //
  }
}
