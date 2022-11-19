import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { combineLatest, count, map } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwDbService } from '~/nw'

@Component({
  selector: 'nwb-xp-chart',
  templateUrl: './xp-chart.component.html',
  styleUrls: ['./xp-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpChartComponent {

  protected config$ = combineLatest({
    level: this.char.level$,
    data: this.db.xpAmounts
  })
  .pipe(map(({ level, data }): ChartConfiguration => {
    return {
      type: 'line',
      options: {
        animation: false,
        backgroundColor: '#FFF',
        elements: {
          point: {
            hoverRadius: (context) => {
              return (level - 1) === context.dataIndex ? 10 : 5
            },
            radius: (context) => {
              return (level - 1) === context.dataIndex ? 8 : 3
            }
          }
        }
      },
      data: {
        labels: data.map((it) => it['Level Number'] + 1),
        datasets: [
          {
            label: 'XP per level',
            data: data.map((it) => it.XPToLevel),
            backgroundColor: '#ffa600'
          }
        ],
      },
    }
  }))

  public constructor(private db: NwDbService, private char: CharacterStore) {
    //
  }
}
