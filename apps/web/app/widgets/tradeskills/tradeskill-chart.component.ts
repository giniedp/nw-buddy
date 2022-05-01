import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, Input, ChangeDetectorRef } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { BehaviorSubject, combineLatest, debounceTime, defer, map, shareReplay, startWith, Subject, switchMap, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

const COLORS = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'].reverse()

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

  private skillInfo$ = defer(() => this.category$)
    .pipe(switchMap((it) => this.nw.tradeskills.skillsByCategory(it)))
    .pipe(switchMap((skills) => {
      return combineLatest(skills.map((it) => {
        return this.nw.translate$(it.Name).pipe(map((name) => {
          return {
            ...it,
            Name: name
          }
        }))
      }))
    }))
    .pipe(shareReplay({
      refCount: true,
      bufferSize: 1
    }))

  private skillTable$ = defer(() => this.skillInfo$)
    .pipe(switchMap((skills) => {
      return combineLatest(skills.map((skill) => {
        return this.nw.tradeskills.skillTableByName(skill.ID)
          .pipe(map((it) => it.filter((i) => i.Level <= skill.MaxLevel)))
      }))
    }))

  private skillLevel$ = defer(() => this.skillInfo$)
    .pipe(switchMap((skills) => {
      return combineLatest(skills.map((skill) => {
        const pref = this.nw.tradeskills.preferences
        return pref
          .observe(skill.ID)
          .pipe(map((it) => it.meta?.level))
          .pipe(debounceTime(500))
          .pipe(startWith(pref.get(skill.ID)?.level))
      }))
    }))

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      skills: this.skillInfo$,
      tables: this.skillTable$,
      levels: this.skillLevel$
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe(({ skills, tables, levels }) => {
      this.chartConfig = {
        type: 'line',
        options: {
          animation: this.chartConfig ? false : undefined,
          elements: {
            point: {
              hoverRadius: (context) => {
                if (levels[context.datasetIndex] === context.dataIndex) {
                  return 10
                }
                return 5
              },
              radius: (context) => {
                if (levels[context.datasetIndex] === context.dataIndex) {
                  return 8
                }
                return 3
              }
            }
          }
        },
        data: {
          labels: tables[0].map((it) => String(it.Level)),
          datasets: tables.map((table, i) => {
            return {
              label: skills[i].Name,
              data: table.map((it) => it.MaximumInfluence),
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
