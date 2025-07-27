import { ConnectedPosition, GlobalPositionStrategy, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay'
import { ComponentPortal } from '@angular/cdk/portal'
import {
  ComponentRef,
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  TemplateRef,
  Type,
  ViewContainerRef,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  delay,
  delayWhen,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  fromEvent,
  map,
  merge,
  NEVER,
  Observable,
  of,
  race,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  timeout,
} from 'rxjs'
import { shareReplayRefCount, tapDebug } from '~/utils'
import { ResizeObserverService } from '~/utils/services/resize-observer.service'
import { TooltipComponent } from './tooltip.component'

export declare type TooltipDirectionX = 'left' | 'right'
export declare type TooltipDirectionY = 'top' | 'bottom'

export declare type TooltipDirection =
  | TooltipDirectionX
  | TooltipDirectionY
  | `${TooltipDirectionX}-${TooltipDirectionY}`
  | `${TooltipDirectionY}-${TooltipDirectionX}`
  | 'auto'
export declare type TooltipScrollStrategy = 'close' | 'reposition'

@Directive({
  standalone: true,
  selector: '[tooltip]',
  exportAs: 'tooltip',
})
export class TooltipDirective {
  private elRef = inject(ElementRef)
  private vcRef = inject(ViewContainerRef)
  private overlay = inject(Overlay)
  private resize = inject(ResizeObserverService)

  @Input()
  public tooltip: string | TemplateRef<any> | Type<any>

  @Input()
  public tooltipContext: any

  @Input()
  public tooltipSticky: boolean

  @Input()
  public tooltipPlacement: TooltipDirection | TooltipDirection[] = 'auto'

  @Input()
  public tooltipClass: string | string[] = null

  @Input()
  public tooltipScrollStrategy: TooltipScrollStrategy = 'reposition'

  @Input()
  public tooltipDelay: number = 100

  @Input()
  public tooltipFadeTime: number = 200

  @Input()
  public tooltipOffset: number = 4

  @Input()
  public tooltipKeep: boolean = false

  @Input()
  public preventClick: boolean

  private overlayRef: OverlayRef
  private portal: ComponentPortal<TooltipComponent>
  private portalRef: ComponentRef<TooltipComponent>
  private globalStrat: GlobalPositionStrategy

  private tooltipActive$ = new BehaviorSubject<boolean>(false)
  private overlayActive$ = new BehaviorSubject<boolean>(false)

  public constructor() {
    this.attachTooltip()
  }

  private attachTooltip(): void {
    whenActive(this.elRef.nativeElement)
      .pipe(distinctUntilChanged())
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (value) => this.tooltipActive$.next(value),
        complete: () => this.tooltipActive$.next(false),
        error: () => this.tooltipActive$.next(false),
      })

    const active$ = combineLatest({
      tooltipActive: this.tooltipActive$,
      overlayActive: this.overlayActive$,
    }).pipe(
      debounceTime(this.tooltipDelay),
      map(({ tooltipActive, overlayActive }) => (this.tooltipKeep ? tooltipActive || overlayActive : tooltipActive)),
      distinctUntilChanged(),
      shareReplayRefCount(1),
    )

    active$
      .pipe(
        switchMap((active) => {
          if (active && this.tooltipSticky) {
            return fromEvent(window, 'mousemove')
          }
          return NEVER
        }),
      )
      .pipe(takeUntilDestroyed())
      .subscribe((e) => {
        this.updateStickyPosition(e as MouseEvent)
      })

    active$.pipe(takeUntilDestroyed()).subscribe({
      next: (value) => {
        if (value) {
          this.showTooltip()
        } else {
          this.hideTooltip()
        }
      },
      complete: () => this.hideTooltip(),
      error: () => this.hideTooltip(),
    })
  }

  public isShown() {
    return this.overlayRef?.hasAttached()
  }

  public toggle() {
    if (this.isShown()) {
      this.hide()
    } else {
      this.show()
    }
  }

  public show(): void {
    this.tooltipActive$.next(true)
  }

  public hide(): void {
    this.tooltipActive$.next(false)
  }

  @HostListener('click', ['$event'])
  protected handleClick(event: MouseEvent) {
    if (this.preventClick) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  private showTooltip() {
    if (!this.tooltip || this.isShown()) {
      return
    }

    this.overlayRef = this.overlayRef || this.createOverlay()
    this.portal = this.portal || new ComponentPortal(TooltipComponent, this.vcRef)
    this.portalRef = this.overlayRef.attach(this.portal)
    if (this.tooltipClass) {
      this.portalRef.setInput('ngClass', this.tooltipClass)
    }
    this.portalRef.setInput('content', this.tooltip)
    this.portalRef.setInput('context', this.tooltipContext)
    this.portalRef.setInput('fadeTime', this.tooltipFadeTime)

    const destroy$ = new Subject<void>()
    this.portalRef.onDestroy(() => destroy$.next())

    const element = this.portalRef.location.nativeElement as HTMLElement
    this.resize
      .observe(element)
      .pipe(debounceTime(50), takeUntil(destroy$))
      .subscribe(() => {
        this.portalRef?.setInput('active', true)
        this.overlayRef?.updatePosition()
      })

    whenActive(this.portalRef.location.nativeElement)
      .pipe(takeUntil(destroy$))
      .subscribe({
        next: (value) => this.overlayActive$.next(value),
        complete: () => this.overlayActive$.next(false),
        error: () => this.overlayActive$.next(false),
      })
  }

  private hideTooltip() {
    const overlayRef = this.overlayRef
    const portalRef = this.portalRef
    this.overlayRef = null
    this.portalRef = null
    if (overlayRef?.hasAttached()) {
      portalRef.setInput('active', false)
      setTimeout(() => {
        overlayRef.detach()
        overlayRef.dispose()
        portalRef.destroy()
      }, this.tooltipFadeTime)
    }
  }

  private createOverlay(): OverlayRef {
    const overlayState = new OverlayConfig()

    if (this.tooltipSticky) {
      this.globalStrat = this.getMousePositionStrategy()
      overlayState.positionStrategy = this.globalStrat
    } else {
      overlayState.positionStrategy = this.getConnectedPositionStrategy()
      this.globalStrat = null
    }

    if (this.tooltipScrollStrategy === 'reposition') {
      overlayState.scrollStrategy = this.overlay.scrollStrategies.reposition()
    } else {
      overlayState.scrollStrategy = this.overlay.scrollStrategies.close()
    }
    overlayState.scrollStrategy.enable()
    return this.overlay.create(overlayState)
  }

  private getPositions() {
    const positions: ConnectedPosition[] = []
    const placements = Array.isArray(this.tooltipPlacement) ? this.tooltipPlacement : [this.tooltipPlacement]
    for (const placement of placements) {
      if (!placement) {
        continue
      }

      const [place1, place2] = placement.split('-')
      if (place1 === 'auto' || place2 === 'auto') {
        continue
      }

      const position: ConnectedPosition = {
        originX: 'center',
        overlayX: 'center',
        originY: 'center',
        overlayY: 'center',
      }
      positions.push(position)

      if (place1 === 'top') {
        position.originY = 'top'
        position.overlayY = 'bottom'
        position.offsetY = -this.tooltipOffset
      }
      if (place1 === 'bottom') {
        position.originY = 'bottom'
        position.overlayY = 'top'
        position.offsetY = this.tooltipOffset
      }
      if (place1 === 'left') {
        position.originX = 'start'
        position.overlayX = 'end'
        position.offsetX = -this.tooltipOffset
      }
      if (place1 === 'right') {
        position.originX = 'end'
        position.overlayX = 'start'
        position.offsetX = this.tooltipOffset
      }
      if (place2 === 'top') {
        position.originY = 'top'
        position.overlayY = 'top'
      }
      if (place2 === 'bottom') {
        position.originY = 'bottom'
        position.overlayY = 'bottom'
      }
      if (place2 === 'left') {
        position.originX = 'start'
        position.overlayX = 'start'
      }
      if (place2 === 'right') {
        position.originX = 'end'
        position.overlayX = 'end'
      }
    }

    if (positions.length === 0) {
      positions.push(
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -this.tooltipOffset },
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: this.tooltipOffset },
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: this.tooltipOffset },
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -this.tooltipOffset },
      )
    }
    return positions
  }
  private getConnectedPositionStrategy() {
    const positions = this.getPositions()
    return this.overlay
      .position()
      .flexibleConnectedTo(this.elRef)
      .withPositions(positions)
      .withPush(true)
      .withFlexibleDimensions(false)
      .withGrowAfterOpen(true)
  }

  private getMousePositionStrategy() {
    return this.overlay.position().global()
  }

  private updateStickyPosition(e: MouseEvent) {
    if (!this.globalStrat) {
      return
    }
    const height = this.overlayRef.overlayElement.clientHeight
    const width = this.overlayRef.overlayElement.clientWidth
    const position = typeof this.tooltipPlacement === 'string' ? this.tooltipPlacement : this.tooltipPlacement[0]

    let x = e.clientX
    let y = e.clientY
    switch (position) {
      case 'auto':
      case 'top':
        y -= height
        x -= width / 2
        y -= this.tooltipOffset
        break
      case 'top-left':
      case 'left-top':
        y -= height
        x -= width
        y -= this.tooltipOffset
        x -= this.tooltipOffset
        break
      case 'top-right':
      case 'right-top':
        y -= height
        y -= this.tooltipOffset
        x += this.tooltipOffset
        break

      case 'bottom':
        x -= width / 2
        y += this.tooltipOffset
        break
      case 'bottom-left':
      case 'left-bottom':
        x -= width
        y += this.tooltipOffset
        x -= this.tooltipOffset
        break
      case 'bottom-right':
      case 'right-bottom':
        y += this.tooltipOffset
        x += this.tooltipOffset
        break

      case 'left':
        x -= width
        y -= height / 2
        x -= this.tooltipOffset
        break
      case 'right':
        y -= height / 2
        x += this.tooltipOffset
        break
    }
    this.globalStrat.left(`${x}px`)
    this.globalStrat.top(`${y}px`)
    this.globalStrat.apply()
  }
}

function whenActive(element: HTMLElement): Observable<boolean> {
  const longpressTime = 300
  const mouseEnter$ = fromEvent(element, 'mouseenter', { passive: true })
  const mouseLeave$ = fromEvent(element, 'mouseleave', { passive: true })
  const touchStart$ = fromEvent(element, 'touchstart', { passive: true })
  const touchEnd$ = fromEvent(element, 'touchend', { passive: true })
  const blur$ = fromEvent(element, 'blur', { passive: true })
  const keydown$ = fromEvent(document, 'keydown', { capture: true })
  const keyup$ = fromEvent(document, 'keyup', { capture: true })
  const clickOutside$ = fromEvent(document, 'click', { passive: true }).pipe(
    filter((e) => !element.contains(e.target as Node)),
  )

  let isTouch = false

  const end$ = merge(mouseLeave$, touchEnd$, blur$)
  const start$ = merge(mouseEnter$, touchStart$).pipe(
    switchMap((e) => {
      // detect if we're on a touch device
      isTouch ||= e.type === 'touchstart'
      if (isTouch && e.type !== 'touchstart') {
        // this is to ingore late 'mouseenter' events, coming from touch input
        return NEVER
      }

      const cancel$ = merge(mouseLeave$, touchEnd$).pipe(map(() => false))
      let activate$: Observable<boolean>

      if (!isTouch) {
        // instant trigger e.g. desktop & mouse usage
        // but wait until mouse holds still
        activate$ = fromEvent(element, 'mousemove').pipe(
          startWith(null),
          debounceTime(50),
          map(() => true),
          take(1),
        )
      } else {
        // delayed trigger to simulate long press
        activate$ = of(true).pipe(delay(longpressTime))
      }

      return race(activate$, cancel$).pipe(
        take(1),
        filter((started) => !!started),
      )
    }),
  )

  const isHolding$ = merge(keydown$, keyup$).pipe(
    map((e) => {
      e.preventDefault()
      return (e as KeyboardEvent).altKey
    }),
    distinctUntilChanged(),
    startWith(false),
  )

  return start$.pipe(
    switchMap(() => {
      return combineLatest({
        isHolding: isHolding$,
        ended: end$.pipe(
          map(() => true),
          startWith(false),
        ),
        cancelled: clickOutside$.pipe(
          map(() => true),
          startWith(false),
        ),
      }).pipe(
        filter(({ isHolding, ended, cancelled }) => !isHolding && (ended || cancelled)),
        map(() => {
          // reset touch memo, so we're not stuck with one input method
          isTouch = false
          return false
        }),
        take(1),
        startWith(true),
      )
    }),
    distinctUntilChanged(),
  )
}

export interface EventListenerOptions {
  capture?: boolean
  passive?: boolean
  once?: boolean
}

export interface ActivationConfig {
  longpressTime: number
  startEvents: string[]
  endEvents: string[]
  options: EventListenerOptions
}
