import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { defer, map } from 'rxjs'
import { NwDataService } from '~/data'

@Component({
  selector: 'nwb-standing-chart',
  templateUrl: './standing-chart.component.html',
  styleUrls: ['./standing-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingChartComponent {
  public chartConfig = defer(() => this.db.data.territoryStanding()).pipe(
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
    })
  )

  public constructor(private db: NwDataService) {
    //
  }
}
