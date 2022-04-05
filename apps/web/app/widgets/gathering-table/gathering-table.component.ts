import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { Xpamountsbylevel } from 'apps/web/nw-data/types';
import { firstValueFrom } from 'rxjs';
import { NwDataService } from '~/core/nw';

async function loadData() {
  return import('../../../nw-data/datatables/javelindata_specializationlevels.json').then((it) => it.default)
}

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    result += (data[i] as any) [key] as number
  }
  return result
}

@Component({
  selector: 'nwb-gathering-table',
  templateUrl: './gathering-table.component.html',
  styleUrls: ['./gathering-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GatheringTableComponent implements OnInit {
  public data

  public gridOptions: GridOptions = {
    columnDefs: [
      {
        field: 'Level Number',
        valueFormatter: (it) => it.value + 1
      },
      {
        field: 'XPToLevel',
        cellStyle: {
          'text-align': 'right'
        }
      },
      {
        headerName: 'XP total',
        cellStyle: {
          'text-align': 'right'
        },
        valueGetter: (it) => accumulate(this.data, 0, it.node.rowIndex, 'XPToLevel'),
      },
      {
        field: 'AttributePoints',
        cellStyle: {
          'text-align': 'right'
        }
      },
      {
        headerName: 'Attribute points total',
        cellStyle: {
          'text-align': 'right'
        },
        valueGetter: (it) => accumulate(this.data, 0, it.node.rowIndex, 'AttributePoints'),
      },
      {
        field: 'AttributeRespecCost',
        cellStyle: {
          'text-align': 'right'
        },
        valueFormatter: (it) => {
          return (it.value / 100).toFixed(2)
        }
      },
    ],
  }

  public constructor(private nwService: NwDataService, private cdRef: ChangeDetectorRef) {}

  public async ngOnInit() {
    this.data = await firstValueFrom(this.nwService.datatablesTradeskillarcana())
    this.cdRef.markForCheck()
  }
}
