import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core'
import { Chart, ChartConfiguration, registerables  } from 'chart.js'

Chart.register(...registerables)

@Component({
  selector: 'nwb-chart',
  styleUrls: ['./chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input()
  public config: ChartConfiguration

  @ViewChild('canvas', { static: true, read: ElementRef })
  public canvas: ElementRef<HTMLCanvasElement>

  private needsUpdate = false
  private chart: Chart
  public constructor(private cdRef: ChangeDetectorRef, private elRef: ElementRef<HTMLElement>) {
    //
  }

  public ngOnInit(): void {
    // new ResizeObserver(() => {
    //   this.chart?.resize()
    // })
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.needsUpdate = true
    this.cdRef.markForCheck()
  }

  public ngOnDestroy(): void {
    this.chart?.destroy()
    this.chart = null
  }

  public ngAfterViewChecked(): void {
    if (this.needsUpdate) {
      this.chart?.destroy()
      this.chart = null
      if (this.config) {
        setTimeout(() => {
          this.chart = new Chart(this.canvas.nativeElement.getContext('2d'), this.config)
        })
      }
    }
  }
}
