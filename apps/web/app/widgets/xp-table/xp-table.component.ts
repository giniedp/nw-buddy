import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core'
import { GridOptions } from 'ag-grid-community'
import { Xpamountsbylevel } from '@nw-data/types'
import { firstValueFrom } from 'rxjs'
import { NwDataService } from '~/core/nw'

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    result += (data[i] as any) [key] as number
  }
  return result
}

@Component({
  selector: 'nwb-xp-table',
  templateUrl: './xp-table.component.html',
  styleUrls: ['./xp-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpTableComponent implements OnInit {
  public data: Xpamountsbylevel[]

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
    this.data = await firstValueFrom(this.nwService.datatablesXpamountsbylevel())
    this.cdRef.markForCheck()
  }
}
