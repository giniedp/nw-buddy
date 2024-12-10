import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { isEqual } from 'lodash'
import { BehaviorSubject, combineLatest, defer, distinctUntilChanged, map, shareReplay, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { NwTradeskillInfo, NwTradeskillService } from '~/nw/tradeskill'
import { ChartModule } from '~/ui/chart'
import { combineLatestOrEmpty } from '~/utils'

const COLORS = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'].reverse()

@Component({
  standalone: true,
  selector: 'nwb-tradeskill-chart',
  templateUrl: './tradeskill-chart.component.html',
  styleUrls: ['./tradeskill-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChartModule, NwModule],
})
export class TradeskillChartComponent {
  private char = inject(CharacterStore)

  @Input()
  public set category(value: string) {
    this.category$.next(value)
  }

  public readonly chartConfig = defer(() =>
    combineLatest({
      skills: this.skillInfo$,
      tables: this.skillTable$,
      levels: this.skillLevel$,
    }),
  ).pipe(
    map(({ skills, tables, levels }): ChartConfiguration => {
      return {
        type: 'line',
        options: {
          animation: false,
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
              },
            },
          },
          hover: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
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
    }),
  )

  private category$ = new BehaviorSubject<string>(null)

  private skillInfo$ = defer(() => this.category$)
    .pipe(switchMap((it) => this.service.skillsByCategory(it)))
    .pipe(
      switchMap((skills) => {
        return combineLatest(
          skills.map((it) => {
            return this.i18n.observe(it.Name).pipe(
              map((name) => {
                return {
                  ...it,
                  Name: name,
                }
              }),
            )
          }),
        )
      }),
    )
    .pipe(distinctUntilChanged<NwTradeskillInfo[]>(isEqual))
    .pipe(
      shareReplay({
        refCount: true,
        bufferSize: 1,
      }),
    )

  private skillTable$ = defer(() => this.skillInfo$).pipe(
    switchMap((skills) => {
      return combineLatest(
        skills.map((skill) => {
          return this.service.skillTableByName(skill.ID).pipe(map((it) => it.filter((i) => i.Level <= skill.MaxLevel)))
        }),
      )
    }),
  )

  private skillLevel$ = defer(() => this.skillInfo$).pipe(
    switchMap((skills) => {
      return combineLatestOrEmpty(skills.map((skill) => this.char.observeProgressionLevel(skill.ID)))
    }),
  )

  public constructor(
    private service: NwTradeskillService,
    private i18n: TranslateService,
  ) {
    //
  }
}
