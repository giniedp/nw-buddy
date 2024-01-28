import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { combineLatest, map } from 'rxjs'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { ChartModule } from '~/ui/chart'

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

  protected config$ = combineLatest({
    data: this.db.weaponMastery
  })
  .pipe(map(({ data }): ChartConfiguration => {
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
            backgroundColor: '#ffa600'
          }
        ],
      },
    }
  }))

  public constructor(private db: NwDataService) {
    //
  }
}
