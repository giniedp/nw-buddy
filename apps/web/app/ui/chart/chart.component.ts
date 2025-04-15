import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  untracked,
  viewChild,
} from '@angular/core'
import { Chart, ChartConfiguration, registerables } from 'chart.js'
import { injectIsBrowser } from '~/utils/injection/platform'

Chart.register(...registerables)

@Component({
  selector: 'nwb-chart',
  exportAs: 'chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="w-full"></canvas>`,
  host: {
    class: 'block',
  },
})
export class ChartComponent implements OnDestroy {
  public config = input<ChartConfiguration>()

  private chart: Chart
  private canvas = viewChild('canvas', { read: ElementRef })
  private isBrowser = injectIsBrowser()

  public constructor() {
    effect(() => {
      const config = this.config()
      untracked(() => this.createChart(config))
    })
  }

  private createChart(config: ChartConfiguration) {
    if (!this.isBrowser) {
      return
    }
    if (this.chart) {
      this.chart.destroy()
    }
    if (config) {
      if (config.options.maintainAspectRatio == null) {
        config.options.maintainAspectRatio = false
      }
      if (config.options.aspectRatio == null) {
        config.options.aspectRatio = 16 / 9
      }
      this.chart = new Chart(this.canvas().nativeElement.getContext('2d'), config)
      this.chart.update()
    }
  }

  public ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  }
}
