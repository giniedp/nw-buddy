import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-standing-chart',
  templateUrl: './standing-chart.component.html',
  styleUrls: ['./standing-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingChartComponent implements OnInit, OnDestroy {
  public chartConfig: ChartConfiguration
  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public async ngOnInit() {
    this.nw.db.data
      .datatablesTerritoryStanding()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.chartConfig = {
          type: 'line',
          options: {
            backgroundColor: '#FFF',
          },
          data: {
            labels: data.map((it) => it.Rank),
            datasets: [
              {
                label: 'XP per level',
                data: data.map((it) => it.InfluenceCost),
                backgroundColor: '#003f5c',
              },
            ],
          },
        }
        console.log(this.chartConfig)
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
