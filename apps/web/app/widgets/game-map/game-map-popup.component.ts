import { Component, ElementRef, OnDestroy, OnInit, effect, inject, input, signal } from '@angular/core'
import { Popup } from 'maplibre-gl'
import { GameMapComponent } from './game-map.component'
import { GameMapProxyService } from './game-map.proxy'

@Component({
  standalone: true,
  selector: 'nwb-game-map-popup',
  template: ` <ng-content></ng-content> `,
  host: {
    class: 'block',
  },
})
export class GameMapPopupComponent implements OnInit, OnDestroy {
  private proxy = inject(GameMapProxyService, { optional: true })
  private parent = inject(GameMapComponent, { optional: true })
  public position = input<[number, number]>()
  protected get map() {
    return (this.parent || this.proxy)?.map
  }

  protected elRef = inject(ElementRef)
  protected popup = new Popup({})

  public constructor() {
    effect(() => {
      if (this.position()) {
        this.popup.setHTML('')
        this.popup.setLngLat(this.position()).setDOMContent(this.elRef.nativeElement).addTo(this.map)
      } else {
        this.popup.remove()
      }
    })
  }

  public ngOnInit() {
    //
  }

  public ngOnDestroy() {
    this.popup.remove()
  }
}
