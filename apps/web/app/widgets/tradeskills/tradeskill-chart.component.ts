import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ChartConfiguration } from 'chart.js'
import { isEqual } from 'lodash'
import { distinctUntilChanged, map, shareReplay, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { NwTradeskillInfo, NwTradeskillService } from '~/nw/tradeskill'
import { ChartModule } from '~/ui/chart'
import { combineLatestOrEmpty } from '~/utils'

const COLORS = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'].reverse()

@Component({
  selector: 'nwb-tradeskill-chart',
  template: `
    @if (config(); as config) {
      <nwb-chart [config]="config" class="bg-base-100 rounded-md p-2" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartModule, NwModule],
  host: {
    class: 'block',
  },
})
export class TradeskillChartComponent {
  private character = inject(CharacterStore)
  private service = inject(NwTradeskillService)
  private i18n = inject(TranslateService)

  public category = input<string>()
  private category$ = toObservable(this.category)
  private skillInfo$ = this.category$.pipe(
    switchMap((it) => this.service.skillsByCategory(it)),
    switchMap((skills) => {
      return combineLatestOrEmpty(
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
    distinctUntilChanged<NwTradeskillInfo[]>(isEqual),
    shareReplay({
      refCount: true,
      bufferSize: 1,
    }),
  )

  private skillTable$ = this.skillInfo$.pipe(
    switchMap((skills) => {
      return combineLatestOrEmpty(
        skills.map((skill) => {
          return this.service.skillTableByName(skill.ID).pipe(map((it) => it.filter((i) => i.Level <= skill.MaxLevel)))
        }),
      )
    }),
  )

  private skillLevel$ = this.skillInfo$.pipe(
    switchMap((skills) => {
      return combineLatestOrEmpty(skills.map((skill) => this.character.observeTradeskillLevel(skill.ID)))
    }),
  )

  private skillInfo = toSignal(this.skillInfo$)
  private skillTable = toSignal(this.skillTable$)
  private skillLevel = toSignal(this.skillLevel$)
  protected config = computed((): ChartConfiguration => {
    const skills = this.skillInfo()
    const tables = this.skillTable()
    const levels = this.skillLevel()
    if (!skills || !tables || !levels) {
      return null
    }
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
        labels: tables[0]?.map((it) => String(it.Level)),
        datasets: tables.map((table, i) => {
          return {
            label: skills[i].Name,
            data: table.map((it) => it.MaximumInfluence),
            backgroundColor: COLORS[i % COLORS.length],
          }
        }),
      },
    }
  })
}
