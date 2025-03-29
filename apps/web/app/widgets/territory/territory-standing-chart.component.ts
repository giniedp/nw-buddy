import { ChangeDetectionStrategy, Component, computed, resource } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { ChartModule } from '~/ui/chart'

@Component({
  selector: 'nwb-territory-standing-chart',
  template: `<nwb-chart [config]="config()" class="bg-base-100 rounded-md p-2" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, ChartModule],
  host: {
    class: 'block',
  },
})
export class TerritoryStandingChartComponent {
  private db = injectNwData()
  private data = resource({
    loader: () => this.db.categoricalRankTerritoryStanding(),
  })
  protected config = computed((): ChartConfiguration => {
    const data = this.data.value() || []
    return {
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
            backgroundColor: '#ffa600',
          },
        ],
      },
    }
  })
}
