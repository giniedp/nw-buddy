import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { ChartModule } from '~/ui/chart'
import { apiResource } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-weapon-chart',
  templateUrl: './weapon-chart.component.html',
  styleUrls: ['./weapon-chart.component.scss'],
  imports: [CommonModule, NwModule, ChartModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class WeaponChartComponent {
  private db = injectNwData()

  protected resource = apiResource({
    loader: async (): Promise<ChartConfiguration> => {
      const data = await this.db.weaponMasteryAll()
      return {
        type: 'line',
        options: {
          animation: false,
          backgroundColor: '#FFF',
        },
        data: {
          labels: data.map((it) => it.Rank + 1),
          datasets: [
            {
              label: 'XP needed from previous level',
              data: data.map((it) => it.MaximumInfluence),
              backgroundColor: '#ffa600',
            },
          ],
        },
      }
    },
  })
  protected config = this.resource.value
}
