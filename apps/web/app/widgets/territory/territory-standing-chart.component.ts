import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { map } from 'rxjs'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { ChartModule } from '~/ui/chart'

@Component({
  standalone: true,
  selector: 'nwb-territory-standing-chart',
  templateUrl: './territory-standing-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ChartModule],
  host: {
    class: 'block',
  },
})
export class TerritoryStandingChartComponent {
  protected config$ = this.db
    .useTable((it) => it.CategoricalProgressionRankData.Territory_Standing)
    .pipe(
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

  public constructor(private db: NwDataService) {
    //
  }
}
