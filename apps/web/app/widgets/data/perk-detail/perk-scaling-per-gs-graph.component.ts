import { Component, computed, input } from '@angular/core'
import { NW_MAX_GEAR_SCORE, NW_MIN_GEAR_SCORE, parseScalingPerGearScore } from '@nw-data/common'
import { ChartConfiguration } from 'chart.js'
import { ChartModule } from '~/ui/chart'

const LINE1COLOR = {
  0: '#2f2f2f',
  1: '#ffa600',
  2: '#ffa600',
  3: '#c98300',
}

@Component({
  selector: 'nwb-perk-scaling-per-gs-graph',
  template: ` <nwb-chart [config]="chartConfig()" class="w-full h-full" /> `,
  imports: [ChartModule],
  host: {
    class: 'block',
  },
})
export class PerkScalingPerGsGraphComponent {
  public data = input<string>()
  public bonus = input(0)
  protected chartData = computed(() => {
    return selectData(this.data(), this.bonus())
  })

  protected chartConfig = computed((): ChartConfiguration => {
    const data = this.chartData()
    const bonus = this.bonus()
    function gsType(index: number) {
      let result = 0
      const gs = data[index]?.gs
      if (!bonus || !gs) {
        return result
      }
      if (gs <= NW_MAX_GEAR_SCORE) {
        result |= 1
      }
      if (gs >= bonus && gs <= NW_MAX_GEAR_SCORE + bonus) {
        result |= 2
      }
      return result
    }
    return {
      type: 'line',
      options: {
        responsive: true,
        animation: false,
        scales: {
          y: {
            position: 'left',
          },
          y1: {
            position: 'right',
          },
        },
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              footer: (it: any) => {
                if (!bonus) {
                  return null
                }
                const index = it?.[0]?.dataIndex
                const type = gsType(index)
                const gs = data[index]?.gs
                if (type > 1) {
                  return `Weapon GS: ${gs - bonus}`
                }
                return null
              },
            },
          },
        },
        hover: {
          mode: 'index',
          intersect: false,
        },
      },
      data: {
        labels: data.map((it) => it.gs),
        datasets: [
          {
            label: 'Scaling value',
            data: data.map((it) => it.acc),
            backgroundColor: '#ffa600',
            pointBackgroundColor: (it: any) => {
              if (!bonus) {
                return '#ffa600'
              }
              const type = gsType(it.dataIndex)
              return LINE1COLOR[type]
            },
            borderWidth: 1,
            yAxisID: 'y1',
            radius: 1,
            spanGaps: true,
            pointRadius: (it: any) => {
              if (!bonus) {
                return 1
              }
              const type = gsType(it.dataIndex)
              return type === 3 ? 3 : 1
            },
          },
          {
            label: 'Scaling per GS',
            data: data.map((it) => it.scaling),
            backgroundColor: '#a05195',
            borderColor: '#a05195',
            borderWidth: 1,
            yAxisID: 'y',
            radius: 1,
            spanGaps: true,
          },
        ],
      },
    }
  })
}

function selectData(value: string, bonusGS: number) {
  bonusGS = bonusGS || 0
  if (!value) {
    return []
  }
  const scaling = parseScalingPerGearScore(value)
  if (!scaling?.length) {
    return []
  }

  const data: Array<{ gs: number; scaling: number; acc: number }> = []
  const minGS = NW_MIN_GEAR_SCORE
  const maxGS = NW_MAX_GEAR_SCORE + bonusGS
  for (let gs = minGS; gs <= maxGS; gs++) {
    const found = scaling.find((it, i) => {
      const next = scaling[i + 1]
      if (!next) {
        return true
      }
      return it.score <= gs && gs < next.score
    })
    if (!found) {
      continue
    }
    data.push({ gs, scaling: found.scaling, acc: 1 })
  }
  for (let i = 1; i < data.length; i++) {
    data[i].acc = data[i - 1].acc + data[i - 1].scaling
  }
  return data
}
