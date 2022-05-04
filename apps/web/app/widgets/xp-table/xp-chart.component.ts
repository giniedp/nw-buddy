import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { map, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-xp-chart',
  templateUrl: './xp-chart.component.html',
  styleUrls: ['./xp-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpChartComponent implements OnInit, OnDestroy {

  public chartConfig: ChartConfiguration
  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public async ngOnInit() {
    this.nw.db.data
      .xpamountsbylevel()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {

        this.chartConfig = {
          type: 'line',
          options: {
            backgroundColor: '#FFF',
          },
          data: {
            labels: data.map((it) => it['Level Number']),
            datasets: [
              {
                label: 'XP per level',
                data: data.map((it) => it.XPToLevel),
                backgroundColor: '#ffa600'
              }
            ],
          },
        }
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
