import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { ChartConfiguration } from 'chart.js'
import { CharacterStore, injectNwData } from '~/data'
import { ChartComponent } from '~/ui/chart'
import { apiResource } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-xp-chart-per-level',
  template: `<nwb-chart [config]="config()" class="bg-base-100 rounded-md p-2" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChartComponent],
  host: {
    class: 'block',
  },
})
export class XpChartPerLevelComponent {
  private character = inject(CharacterStore)
  private db = injectNwData()

  private level = toSignal(this.character.level$, {
    initialValue: NW_MAX_CHARACTER_LEVEL,
  })

  private resource = apiResource({
    loader: () => this.db.xpLevels(),
  })

  protected config = computed<ChartConfiguration>(() => {
    const level = this.level()
    const data = this.resource.value() || []
    return {
      type: 'line',
      options: {
        animation: false,
        backgroundColor: '#FFF',
        elements: {
          point: {
            hoverRadius: (context) => {
              return level - 1 === context.dataIndex ? 10 : 5
            },
            radius: (context) => {
              return level - 1 === context.dataIndex ? 8 : 3
            },
          },
        },
      },
      data: {
        labels: data.map((it) => it['Level Number'] + 1),
        datasets: [
          {
            label: 'XP per level',
            data: data.map((it, i) => {
              return it.XPToLevel - (data[i - 1]?.XPToLevel || 0)
            }),
            backgroundColor: '#ffa600',
          },
        ],
      },
    }
  })
}
