import { CommonModule } from '@angular/common'
import { Component, DestroyRef, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { DomSanitizer } from '@angular/platform-browser'
import { BehaviorSubject, ReplaySubject, delay, filter, fromEvent, map, switchMap } from 'rxjs'
import { selectStream, tapDebug } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'

export type Landmark = LandmarkPoint | LandmarkZone

export interface LandmarkPoint extends LandmarkData {
  point: number[]
}

export interface LandmarkZone extends LandmarkData {
  shape: number[][]
}

export interface LandmarkData {
  title: string
  color: string
  outlineColor?: string
  radius?: number
  opacity?: number
}

export interface MapView {
  x: number
  y: number
  zoom: number
}

@Component({
  standalone: true,
  selector: 'nwb-land-map',
  template: `
    @if (!isOverwolf)  {
      <iframe [src]="iframeSrc$ | async" class="flex-1 w-full h-full" #frame></iframe>
      <ng-content></ng-content>
    }
  `,
  host: {
    class: 'block',
    '[class.hidden]': 'isOverwolf',
  },
  imports: [CommonModule],
})
export class LandMapComponent implements OnInit {
  @ViewChild('frame', { static: false })
  protected iframe: ElementRef<HTMLIFrameElement>

  @Input()
  public set map(value: string) {
    this.mapId$.next(value)
  }

  @Input()
  public set landmarks(value: Landmark[]) {
    this.landmarks$.next(value)
  }

  @Input()
  public set fit(value: boolean) {
    this.fit$.next(value)
  }

  @Input()
  public set view(value: MapView) {
    this.view$.next(value)
  }

  public setZoom(value: number) {
    this.postMessage({ type: 'SET_EXTERNAL_ZOOM', payload: value })
  }

  public setCenter(x: number, y: number) {
    this.postMessage({ type: 'SET_EXTERNAL_CENTER', payload: [x, y] })
  }

  public setView(x: number, y: number, zoom: number) {
    this.postMessage({ type: 'SET_EXTERNAL_VIEW', payload: { zoom: zoom, center: [x, y] } })
  }

  public setData(data: any) {
    this.postMessage({ type: 'SET_EXTERNAL_DATA', payload: data, reproject: true })
  }

  public get isOverwolf() {
    return this.platform.isOverwolf
  }

  private platform = inject(PlatformService)
  private sanitizer = inject(DomSanitizer)
  protected ready$ = new ReplaySubject<void>(1)
  protected mapId$ = new BehaviorSubject<string>(null)
  protected fit$ = new BehaviorSubject<boolean>(true)
  protected view$ = new ReplaySubject<MapView>(null)
  protected landmarks$ = new ReplaySubject<Landmark[]>(1)
  protected dRef = inject(DestroyRef)
  protected iframeSrc$ = selectStream({
    fit: this.fit$,
    mapId: this.mapId$,
  }, ({ fit, mapId }) => {
    if (this.isOverwolf) {
      return ''
    }
    mapId = encodeURIComponent(mapId || 'newworld_vitaeeterna')
    const url = `https://aeternum-map.gg/external.html?map=${mapId}&embed=true&ref=nwbuddy&fit=${fit ? 'true' : 'false'}`
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  })

  private postMessage(message: any) {
    this.iframe.nativeElement.contentWindow.postMessage(message, '*')
  }

  public constructor() {
    fromEvent<MessageEvent>(window, 'message')
      .pipe(filter((it) => it.origin === 'https://aeternum-map.gg'))
      .pipe(map((it) => it.data))
      .pipe(filter((it) => it && it.type && it.payload))
      .pipe(takeUntilDestroyed())
      .subscribe(({ type, payload }) => {
        if (type === 'ready') {
          this.ready$.next()
        }
        console.log(type, payload)
      })
  }

  public ngOnInit() {
    this.ready$
      .pipe(
        switchMap(() => this.landmarks$),
        map((landmarks) => {
          if (!landmarks?.length) {
            return []
          }
          return landmarks.map((data) => {
            const result = {
              type: 'Feature',
              properties: {
                'fill-color': data.color ?? '#52b874',
                'fill-outline-color': data.outlineColor ?? '#121212',
                'fill-opacity': data.opacity ?? 1,
              } as Object,
              geometry: {
                type: 'Point',
                coordinates: [0, 0] as any,
              },
            }
            if ('point' in data) {
              result.properties = {
                ...result.properties,
                'circle-radius': data.radius ?? 10,
                'circle-stroke-width': 1,
                title: data.title
              }
              result.geometry = {
                type: 'Point',
                coordinates: data.point,
              }
            }
            if ('shape' in data) {
              result.geometry = {
                type: 'Polygon',
                coordinates: [data.shape],
              }
            }
            return result
          })
        }),
        takeUntilDestroyed(this.dRef),
      )
      .subscribe((data) => {
        this.setData(data)
      })
    this.ready$.pipe(
      switchMap(() => this.fit$),
      filter((it) => !it),
      switchMap(() => this.view$),
      filter((it) => !!it),
      takeUntilDestroyed(this.dRef),
    ).subscribe(({ x, y, zoom }) => {
      // this.setZoom(zoom)
      // this.setCenter(x, y)
      this.setView(x, y, zoom)
    })
  }
}
