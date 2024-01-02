import { CommonModule } from '@angular/common'
import { Component, DestroyRef, ElementRef, EventEmitter, Input, NgZone, OnInit, Output, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { DomSanitizer } from '@angular/platform-browser'
import { BehaviorSubject, ReplaySubject, delay, filter, fromEvent, map, switchMap } from 'rxjs'
import { runInZone, runOutsideZone, selectStream, tapDebug } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'

export type Landmark = LandmarkPoint | LandmarkZone

export interface LandmarkPoint extends LandmarkData {
  point: number[]
}

export interface LandmarkZone extends LandmarkData {
  shape: number[][]
}

export interface LandmarkData {
  id?: string
  title?: string
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

export interface MapViewBounds {
  min: number[]
  max: number[]
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

  @Input()
  public set bounds(value: MapViewBounds) {
    this.bounds$.next(value)
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

  public fitBounds(min: number[], max: number[]) {
    if (!min || !max) {
      return
    }
    // swap x/y
    min = [min[1], min[0]]
    max = [max[1], max[0]]
    this.postMessage({ type: 'FIT_BOUNDS', payload: [min, max] })
  }

  public get isOverwolf() {
    return this.platform.isOverwolf
  }

  @Output()
  public featureClicked = new EventEmitter<string>()

  private zone = inject(NgZone)
  private platform = inject(PlatformService)
  private sanitizer = inject(DomSanitizer)
  protected ready$ = new ReplaySubject<void>(1)
  protected mapId$ = new BehaviorSubject<string>(null)
  protected fit$ = new BehaviorSubject<boolean>(true)
  protected view$ = new ReplaySubject<MapView>(null)
  protected bounds$ = new ReplaySubject<MapViewBounds>(null)
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
      .pipe(runOutsideZone(this.zone))
      .pipe(filter((it) => it.origin === 'https://aeternum-map.gg'))
      .pipe(map((it) => it.data))
      .pipe(filter((it) => it && it.type && it.payload))

      .pipe(takeUntilDestroyed())
      .subscribe(({ type, payload }) => {
        if (type === 'ready') {
          this.ready$.next()
        }
        if (type === 'click') {
          this.zone.run(() => this.featureClicked.emit(payload?.properties?.id))
        }
      })
  }

  public ngOnInit() {
    this.ready$
      .pipe(
        switchMap(() => this.landmarks$),
        map(landmarkToFeature),
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
      this.setView(x, y, zoom)
    })

    this.ready$.pipe(
      switchMap(() => this.fit$),
      filter((it) => !it),
      switchMap(() => this.bounds$),
      filter((it) => !!it),
      takeUntilDestroyed(this.dRef),
    ).subscribe(({ min, max }) => {
      this.fitBounds(min, max)
    })
  }
}

function landmarkToFeature(landmarks: Landmark[]) {
  if (!landmarks?.length) {
    return []
  }
  return landmarks.map((data) => {
    const result = {
      type: 'Feature',
      properties: {
        'fill-color': data.color,
        'fill-outline-color': data.outlineColor ?? '#121212',
        'fill-opacity': data.opacity ?? 1,
        title: data.title,
        id: data.id,
        interactive: !!data.id || !!data.title,
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
}
