import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { ChartModule } from '~/ui/chart'

@Component({
  standalone: true,
  selector: 'nwb-territory-standing-chart',
  templateUrl: './territory-standing-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ChartModule],
  host: {
    class: 'block'
  }
})
export class TerritoryStandingChartComponent {

  protected config$ = defer(() => this.db.data.territoryStanding())
  .pipe(map((data): ChartConfiguration => {
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
  }))

  public constructor(private db: NwDbService) {
    //
  }

}
