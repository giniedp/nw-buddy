import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, inject, input, signal } from '@angular/core'
import { MapEventType } from 'maplibre-gl'
import { GameMapHost } from './game-map-host'
import { GameMapService } from './game-map.service'

@Component({
  selector: 'game-map-coords',
  template: `
    @if (active()) {
      <span> x: {{ x() | number: format() }} </span>
      <span> y: {{ y() | number: format() }} </span>
    }
  `,
  imports: [CommonModule],
  host: {
    class: 'inline',
  },
})
export class GameMapCoordsComponent implements OnInit, OnDestroy {
  private service = inject(GameMapService)
  private host = inject(GameMapHost)
  private get map() {
    return this.host.map
  }

  public format = input<string>('0.0-0')
  protected x = signal<number>(null)
  protected y = signal<number>(null)
  protected active = signal(false)

  public ngOnInit() {
    this.map.on('mouseenter', this.handleMouseEnter)
    this.map.on('mousemove', this.handleMouseMove)
    this.map.on('mouseleave', this.handleMouseLeave)
  }

  public ngOnDestroy() {
    this.map.off('mouseenter', this.handleMouseEnter)
    this.map.off('mousemove', this.handleMouseMove)
    this.map.off('mouseleave', this.handleMouseLeave)
  }

  private handleMouseEnter = () => {}
  private handleMouseLeave = () => {
    this.active.set(false)
  }

  private handleMouseMove = (e: MapEventType['mousemove']) => {
    const [x, y] = this.service.xyFromLngLat(e.lngLat.toArray())
    this.x.set(x)
    this.y.set(y)
    this.active.set(true)
  }
}
