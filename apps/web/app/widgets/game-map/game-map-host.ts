import { Injectable, Signal, TemplateRef, inject, signal } from '@angular/core'
import { Map } from 'maplibre-gl'
import { ReplaySubject } from 'rxjs'

@Injectable()
export class GameMapHost {
  private parent = inject(GameMapHost, { optional: true, skipSelf: true })
  private currentMap: Map
  private readySubject = new ReplaySubject<true>(1)
  private activeTips = signal<Array<TemplateRef<any>>>([])
  private get root(): GameMapHost {
    return this.parent ? this.parent.root : this
  }

  public get map() {
    return this.currentMap
  }

  public get tooltips() {
    return this.root.activeTips()
  }

  public ready$ = this.readySubject.asObservable()

  public setMap(map: Map) {
    this.currentMap = map
    if (this.parent) {
      this.parent.setMap(map)
    }
  }

  public setReady() {
    this.readySubject.next(true)
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
