import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Vitals, Vitalscategories, Vitalsleveldata, Vitalsmodifierdata } from '@nw-data/types';
import { firstValueFrom } from 'rxjs';
import { NwService } from '~/core/nw';

@Component({
  selector: 'nwb-vitals-table',
  templateUrl: './vitals-table.component.html',
  styleUrls: ['./vitals-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VitalsTableComponent implements OnInit {
  public data: Vitals[]

  public gridOptions = this.nw.gridOptions({
    columnDefs: [
      {
        field: 'Name',
        valueGetter: ({data}) => this.nw.translate(data.DisplayName),
        width: 300,
      },
      {
        headerName: 'Category',
        valueGetter: ({data}) => {
          const category = this.categoryById.get(data.VitalsID)
          return this.nw.translate(category?.DisplayName)
        }
      },
      {
        field: 'Level',
        width: 100
      },
      {
        field: 'Family',
        width: 100
      },
      {
        field: 'LootTableId'
      }
    ],
  })

  private categories: Vitalscategories[]
  private categoryById: Map<string, Vitalscategories>

  private leveldata: Vitalsleveldata[]
  private modifier: Vitalsmodifierdata[]

  public constructor(
//     private nw: NwDataService,
    private nw: NwService,
    private cdRef: ChangeDetectorRef
  ) {}

  public async ngOnInit() {
    Promise.all([
      firstValueFrom(this.nw.raw.datatablesVitals()),
      firstValueFrom(this.nw.raw.datatablesVitalscategories()),
      firstValueFrom(this.nw.raw.datatablesVitalsleveldata()),
      firstValueFrom(this.nw.raw.datatablesVitalsmodifierdata()),
    ]).then(([ vitals, categories, leveldata, modifier ]) => {
      this.data = vitals
      this.categories = categories
      this.categoryById = new Map(categories.map((it) => [it.VitalsCategoryID, it]))
      this.leveldata = leveldata
      this.modifier = modifier
      this.cdRef.markForCheck()
    })
  }
}
