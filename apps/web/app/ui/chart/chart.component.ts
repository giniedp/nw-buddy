import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core'
import { Chart, ChartConfiguration, registerables  } from 'chart.js'
import { ReplaySubject, Subject, takeUntil } from 'rxjs'

Chart.register(...registerables)

@Component({
  selector: 'nwb-chart',
  styleUrls: ['./chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
})
export class ChartComponent implements OnInit, OnDestroy {

  @Input()
  public set config(value: ChartConfiguration) {
    this.config$.next(value)
  }

  @ViewChild('canvas', { static: true, read: ElementRef })
  public canvas: ElementRef<HTMLCanvasElement>

  private config$ = new ReplaySubject<ChartConfiguration>(1)
  private destroy$ = new Subject()
  private chart: Chart

  public ngOnInit(): void {
    this.config$.pipe(takeUntil(this.destroy$)).subscribe((config) => {
      this.destroyChart()
      if (config) {

      }
      this.createChart(config)
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
    this.destroyChart()
  }

  private destroyChart() {
    this.chart?.destroy()
    this.chart = null
  }

  private createChart(config: ChartConfiguration) {
    this.chart = new Chart(this.canvas.nativeElement.getContext('2d'), config)
  }
}
