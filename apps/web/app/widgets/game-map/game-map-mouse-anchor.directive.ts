import { Directive, ElementRef, OnDestroy, OnInit, Renderer2, inject } from '@angular/core'
import { MapMouseEvent } from 'maplibre-gl'
import { GameMapHost } from './game-map-host'

@Directive({
  standalone: true,
  selector: '[nwbGameMapMouseAnchor]',
  host: {
    class: 'absolute pointer-events-none inline-block',
  },
})
export class GameMapMouseAnchorDirective implements OnInit, OnDestroy {
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  private renderer = inject(Renderer2)
  private host = inject(GameMapHost)
  private get map() {
    return this.host.map
  }
  public ngOnInit(): void {
    this.map.on('mousemove', this.handleMousemove)
  }
  public ngOnDestroy(): void {
    this.map.off('mousemove', this.handleMousemove)
  }

  private handleMousemove = (e: MapMouseEvent) => {
    this.renderer.setStyle(this.elRef.nativeElement, 'left', `${e.point.x + 8}px`)
    this.renderer.setStyle(this.elRef.nativeElement, 'top', `${e.point.y + 8}px`)
  }
  private handleMouseleave = (e: MapMouseEvent) => {
    //
  }
}
