import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { from, map } from 'rxjs'
import { injectNwData } from '~/data'

@Component({
  selector: 'nwb-standing-chart',
  templateUrl: './standing-chart.component.html',
  styleUrls: ['./standing-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingChartComponent {
  private db = injectNwData()
  public chartConfig = from(this.db.categoricalRankTerritoryStanding()).pipe(
    map((data): ChartConfiguration => {
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
    }),
  )
}
