import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types';
import { GridOptions } from 'ag-grid-community';
import { BehaviorSubject, combineLatest, defer, Observable } from 'rxjs';
import { NwDataService } from '~/core/nw';
import { getItemId } from '~/core/nw/utils';
import { DataTableAdapter } from '~/ui/data-table';

@Component({
  selector: 'nwb-loot-table',
  templateUrl: './loot-table.component.html',
  styleUrls: ['./loot-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LootTableComponent extends DataTableAdapter<ItemDefinitionMaster | Housingitems> implements OnInit {

  public set tableId(value: string) {
    this.tableId$.next(value)
  }

  public set tags(value: string[]) {
    this.tags$.next(value || [])
  }

  public entities: Observable<(ItemDefinitionMaster | Housingitems)[]>
  //  = defer(() => combineLatest({
  //   tableId: this.tableId$,
  //   tags: this.tags$
  // }))

  private tableId$ = new BehaviorSubject<string>(null)
  private tags$ = new BehaviorSubject<string[]>([])

  constructor(private db: NwDataService) {
    super()
  }

  ngOnInit(): void {
  }

  public entityID(item: ItemDefinitionMaster | Housingitems): string {
    return getItemId(item)
  }

  public entityCategory(item: ItemDefinitionMaster | Housingitems): string {
    throw null;
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    throw new Error('Method not implemented.');
  }
}
