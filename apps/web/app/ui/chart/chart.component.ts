import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  Input,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Chart, ChartConfiguration, registerables } from 'chart.js'
import { Observable, map, takeUntil, tap } from 'rxjs'
import { injectIsBrowser } from '~/utils/injection/platform'

Chart.register(...registerables)

@Injectable()
export abstract class ChartSource {
  abstract config: Observable<ChartConfiguration>
}

@Component({
  standalone: true,
  selector: 'nwb-chart',
  exportAs: 'chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
  host: {
    class: 'block',
  },
})
export class ChartComponent extends ComponentStore<{ config: ChartConfiguration}> implements OnInit {
  @Input()
  public set config(value: ChartConfiguration) {
    this.patchState({ config: value})
  }

  @ViewChild('canvas', { static: true, read: ElementRef })
  public canvas: ElementRef<HTMLCanvasElement>

  private chart: Chart
  private isBrowser = injectIsBrowser()

  public constructor(
    @Optional()
    private source: ChartSource
  ) {
    super({ config: null })
  }

  public ngOnInit(): void {
    if (this.source) {
      this.patchState(this.source.config.pipe(map((config) => ({ config }))))
    }
    this.state$
      .pipe(takeUntil(this.destroy$))
      .pipe(
        tap({
          next: ({config}) => {
            this.destroyChart()
            if (config) {
              this.createChart(config)
            }
          },
          finalize: () => this.destroyChart(),
        })
      )
      .subscribe()
  }

  private destroyChart() {
    this.chart?.destroy()
    this.chart = null
  }

  private createChart(config: ChartConfiguration) {
    if (this.isBrowser) {
      this.chart = new Chart(this.canvas.nativeElement.getContext('2d'), config)
      this.chart.update()
    }
  }
}
