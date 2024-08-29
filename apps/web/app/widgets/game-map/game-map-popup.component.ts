import { Component, ElementRef, OnDestroy, OnInit, effect, inject, input } from '@angular/core'
import { Popup } from 'maplibre-gl'
import { GameMapHost } from './game-map-host'

@Component({
  standalone: true,
  selector: 'nwb-game-map-popup',
  template: ` <ng-content></ng-content> `,
  host: {
    class: 'block',
  },
})
export class GameMapPopupComponent implements OnInit, OnDestroy {
  private host = inject(GameMapHost, { optional: true })
  public position = input<[number, number]>()
  protected get map() {
    return this.host.map
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
