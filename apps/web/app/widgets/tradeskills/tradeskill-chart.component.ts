import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, Input, ChangeDetectorRef } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { BehaviorSubject, combineLatest, map, Subject, switchMap, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

const COLORS = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600']

@Component({
  selector: 'nwb-tradeskill-chart',
  templateUrl: './tradeskill-chart.component.html',
  styleUrls: ['./tradeskill-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeskillChartComponent implements OnInit, OnDestroy {
  @Input()
  public set category(value: string) {
    this.category$.next(value)
  }

  public chartConfig: ChartConfiguration

  private destroy$ = new Subject()
  private category$ = new BehaviorSubject<string>(null)

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    this.category$
      .pipe(switchMap((it) => this.nw.tradeskills.skillsByCategory(it)))
      .pipe(
        switchMap((skills) => {
          return combineLatest(
            skills.map((skill) => {
              return this.nw.tradeskills.skillTableByName(skill.ID).pipe(
                map((table) => {
                  return {
                    skill,
                    table,
                  }
                })
              )
            })
          )
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        data = data.filter((it) => !!it.skill && !!it.table)
        const data0 = data[0]
        const maxLevel = data0.skill.MaxLevel
        this.chartConfig = {
          type: 'line',
          options: {
            backgroundColor: '#FFF',
          },
          data: {
            labels: data0.table.filter((it) => it.Level <= maxLevel).map((it) => String(it.Level)),
            datasets: data.map((it, i) => {
              return {
                label: this.nw.translate(it.skill.Name),
                data: it.table.filter((it) => it.Level <= maxLevel).map((it) => it.MaximumInfluence),
                backgroundColor: COLORS[i % COLORS.length],
              }
            }),
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
