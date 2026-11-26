import { CommonModule } from '@angular/common'
import { Component, ElementRef, OnDestroy, OnInit, inject, input, signal, viewChild } from '@angular/core'
import { MapEventType, Marker } from 'maplibre-gl'
import { GameMapHost } from './game-map-host'
import { GameMapService } from './game-map.service'

@Component({
  selector: 'game-map-coords',
  template: `
    @if (active()) {
      <span> x: {{ x() | number: format() }} </span>
      <span> y: {{ y() | number: format() }} </span>
    }
    <div #menu class="hidden">
      <ul class="menu menu-sm bg-base-200 rounded-box shadow-lg p-1 font-sans">
        <li>
          <button (click)="copyCoordinates()">Copy coordinates</button>
        </li>
      </ul>
    </div>
  `,
  imports: [CommonModule],
  host: {
    class: 'inline-block',
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

  private menu = viewChild.required<ElementRef<HTMLElement>>('menu')
  private menuMarker: Marker = null
  private menuCoords: [number, number] = null

  public ngOnInit() {
    this.map.on('mousemove', this.handleMouseMove)
    this.map.on('mouseleave', this.handleMouseLeave)
    this.map.on('contextmenu', this.handleContextMenu)
    this.map.on('mousedown', this.closeMenu)
    this.map.on('zoomstart', this.closeMenu)
  }

  public ngOnDestroy() {
    this.map.off('mousemove', this.handleMouseMove)
    this.map.off('mouseleave', this.handleMouseLeave)
    this.map.off('contextmenu', this.handleContextMenu)
    this.map.off('mousedown', this.closeMenu)
    this.map.off('zoomstart', this.closeMenu)
    this.closeMenu()
  }

  protected copyCoordinates() {
    if (this.menuCoords) {
      const [x, y] = this.menuCoords
      navigator.clipboard.writeText(`${x.toFixed(2)}, ${y.toFixed(2)}`)
    }
    this.closeMenu()
  }

  private handleMouseLeave = () => {
    this.active.set(false)
  }

  private handleMouseMove = (e: MapEventType['mousemove']) => {
    const [x, y] = this.service.xyFromLngLat(e.lngLat.toArray())
    this.x.set(x)
    this.y.set(y)
    this.active.set(true)
  }

  private handleContextMenu = (e: MapEventType['contextmenu']) => {
    this.closeMenu()
    const [x, y] = this.service.xyFromLngLat(e.lngLat.toArray())
    this.menuCoords = [x, y]
    const element = this.menu().nativeElement
    element.classList.remove('hidden')
    this.menuMarker = new Marker({ element, anchor: 'top-left', offset: [4, 4] }).setLngLat(e.lngLat).addTo(this.map)
  }

  private closeMenu = (e?: { originalEvent?: Event }) => {
    const target = e?.originalEvent?.target as Node
    if (target && this.menu().nativeElement.contains(target)) {
      return
    }
    if (this.menuMarker) {
      this.menuMarker.remove()
      this.menuMarker = null
    }
    this.menuCoords = null
  }
}
