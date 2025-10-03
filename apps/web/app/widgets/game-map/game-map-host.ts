import { inject, Injectable, signal, TemplateRef } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { Map } from 'maplibre-gl'
import { distinctUntilChanged, filter } from 'rxjs'

@Injectable()
export class GameMapHost {
  private parent = inject(GameMapHost, { optional: true, skipSelf: true })

  private activeTips = signal<Array<TemplateRef<any>>>([])
  private get root(): GameMapHost {
    return this.parent ? this.parent.root : this
  }

  public mapInstance = signal<Map>(null)
  public mapIsReady = signal<boolean>(false)
  public get map() {
    return this.mapInstance()
  }

  public get tooltips() {
    return this.root.activeTips()
  }

  public ready$ = toObservable(this.mapIsReady).pipe(
    filter((it) => !!it),
    distinctUntilChanged(),
  )

  public setMap(map: Map) {
    this.mapInstance.set(map)
    if (this.parent) {
      this.parent.setMap(map)
    }
  }

  public setReady() {
    this.mapIsReady.set(true)
    if (this.parent) {
      this.parent.setReady()
    }
  }

  public addTooltip(tooltip: TemplateRef<any>) {
    const tooltips = this.root.activeTips()
    this.root.activeTips.set([...tooltips, tooltip])
  }

  public removeTooltip(tooltip: TemplateRef<any>) {
    const tooltips = this.root.activeTips().filter((it) => it !== tooltip)
    this.root.activeTips.set(tooltips)
  }
}
