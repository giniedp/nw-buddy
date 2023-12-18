import { CommonModule } from '@angular/common'
import { Component, DestroyRef, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { DomSanitizer } from '@angular/platform-browser'
import { BehaviorSubject, ReplaySubject, delay, filter, fromEvent, map, switchMap } from 'rxjs'
import { selectStream } from '~/utils'

export interface Landmark {
  title: string
  color: string
  point: number[]
  outlineColor?: string
  radius?: number
  opacity?: number
}

@Component({
  standalone: true,
  selector: 'nwb-land-map',
  template: `
    <iframe [src]="iframeSrc$ | async" class="flex-1 w-full h-full" #frame></iframe>
    <ng-content></ng-content>
  `,
  host: {
    class: 'block',
  },
  imports: [CommonModule],
})
export class LandMapComponent implements OnInit {
  @ViewChild('frame', { static: true })
  protected iframe: ElementRef<HTMLIFrameElement>

  @Input()
  public set map(value: string) {
    this.mapId$.next(value)
  }

  @Input()
  public set landmarks(value: Landmark[]) {
    this.landmarks$.next(value)
  }

  public setZoom(value: number) {
    this.postMessage({ type: 'SET_EXTERNAL_ZOOM', payload: value })
  }

  public setCenter(x: number, y: number) {
    this.postMessage({ type: 'SET_EXTERNAL_CENTER', payload: [x, y] })
  }

  public setView(x: number, y: number, zoom: number) {
    this.postMessage({ type: 'SET_EXTERNAL_VIEW', payload: { zoom: zoom }, center: [x, y] })
  }

  public setData(data: any) {
    this.postMessage({ type: 'SET_EXTERNAL_DATA', payload: data, reproject: true })
  }

  private sanitizer = inject(DomSanitizer)
  protected ready$ = new ReplaySubject<void>(1)
  protected mapId$ = new BehaviorSubject<string>(null)
  protected landmarks$ = new ReplaySubject<Landmark[]>(1)
  protected dRef = inject(DestroyRef)
  protected iframeSrc$ = selectStream(
    this.mapId$.pipe(
      map((it) => {
        it = encodeURIComponent(it || 'newworld_vitaeeterna')
        const url = `https://aeternum-map.gg/external.html?map=${it}&embed=true&ref=nwbuddy&fit=true`
        return this.sanitizer.bypassSecurityTrustResourceUrl(url)
      }),
    ),
  )

  private postMessage(message: any) {
    this.iframe.nativeElement.contentWindow.postMessage(message, '*')
  }

  public constructor() {
    fromEvent<MessageEvent>(window, 'message')
      .pipe(filter((it) => it.origin === 'https://aeternum-map.gg'))
      .pipe(map((it) => it.data))
      .pipe(filter((it) => it && it.type && it.payload))
      .pipe(takeUntilDestroyed())
      .subscribe(({ type }) => {
        if (type === 'ready') {
          this.ready$.next()
        }
      })
  }

  public ngOnInit() {
    this.ready$
      .pipe(
        switchMap(() => this.landmarks$),
        delay(1000),
        takeUntilDestroyed(this.dRef),
      )
      .subscribe((landmarks) => {
        this.setData(
          landmarks.map(({ title, color, outlineColor, point, radius, opacity }) => {
            return {
              type: 'Feature',
              properties: {
                'fill-color': color ?? '#52b874',
                'fill-outline-color': outlineColor ?? '#121212',
                'circle-stroke-width': 1,
                'circle-radius': radius ?? 10,
                'fill-opacity': opacity ?? 1,
                title: title,
              },
              geometry: {
                type: 'Point',
                coordinates: point,
              },
            }
          }),
        )
      })
  }
}
