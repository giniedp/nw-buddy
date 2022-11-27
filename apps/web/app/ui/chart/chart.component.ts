import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core'
import { Chart, ChartConfiguration, registerables } from 'chart.js'
import { Observable, ReplaySubject, Subject, takeUntil } from 'rxjs'

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
    class: 'block'
  },
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

  public constructor(
    @Optional()
    private source: ChartSource
  ) {}
  public ngOnInit(): void {
    if (this.source) {
      this.source.config.pipe(takeUntil(this.destroy$)).subscribe(this.config$)
    }
    this.config$.pipe(takeUntil(this.destroy$)).subscribe((config) => {
      this.destroyChart()
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
