import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { CharacterStore, injectNwData } from '~/data'
import { ChartComponent } from '~/ui/chart'

@Component({
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

  private level = this.character.level

  private resource = resource({
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
