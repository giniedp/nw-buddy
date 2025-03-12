import { ConnectedPosition, GlobalPositionStrategy, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay'
import { ComponentPortal } from '@angular/cdk/portal'
import {
  ComponentRef,
  Directive,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  TemplateRef,
  Type,
  ViewContainerRef,
} from '@angular/core'
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  of,
  switchMap,
  take,
  takeUntil,
} from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { runInZone } from '~/utils/rx/run-in-zone'
import { TooltipComponent } from './tooltip.component'

export declare type TooltipDirectionX = 'left' | 'right'
export declare type TooltipDirectionY = 'top' | 'bottom'

export declare type TooltipDirection =
  | TooltipDirectionX
  | TooltipDirectionY
  | `${TooltipDirectionX}-${TooltipDirectionY}`
  | `${TooltipDirectionY}-${TooltipDirectionX}`
  | 'auto'
export declare type TooltipTriggerType = 'click' | 'hover'
export declare type TooltipScrollStrategy = 'close' | 'reposition'

@Directive({
  standalone: true,
  selector: '[tooltip]',
  exportAs: 'tooltip',
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input()
  public tooltip: string | TemplateRef<any> | Type<any>

  @Input()
  public tooltipContext: any

  @Input()
  public tooltipSticky: boolean

  @Input()
  public tooltipPlacement: TooltipDirection | TooltipDirection[] = 'auto'

  // @Input()
  // public tooltipTrigger: TooltipTriggerType = 'hover'

  @Input()
  public tooltipClass: string | string[] = null

  @Input()
  public tooltipScrollStrategy: TooltipScrollStrategy = 'reposition'

  @Input()
  public tooltipDelay: number = 150

  @Input()
  public tooltipOffset: number = 4

  @Input()
  public tooltipKeep: boolean = false

  @Input()
  public preventClick: boolean

  private destroy$ = new Subject<void>()

  private overlayRef: OverlayRef
  private portal: ComponentPortal<TooltipComponent>
  private portalRef: ComponentRef<TooltipComponent>
  private globalStrat: GlobalPositionStrategy

  private tooltipActive$ = new BehaviorSubject<boolean>(false)
  private overlayActive$ = new BehaviorSubject<boolean>(false)

  public constructor(
    private elRef: ElementRef,
    private vcRef: ViewContainerRef,
    private overlay: Overlay,
    private zone: NgZone,
  ) {}

  public ngOnDestroy(): void {
    this.destroy$.next()
  }

  public ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      whenActive({
        element: this.elRef.nativeElement,
        startEvents: ['mouseenter', 'focus'],
        endEvents: ['mouseleave', 'blur'],
        options: { passive: true },
      })
        .pipe(distinctUntilChanged())
        .pipe(takeUntil(this.destroy$))
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
            return EMPTY
          }),
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe((e) => {
          this.updateStickyPosition(e as MouseEvent)
        })

      active$
        .pipe(runInZone(this.zone))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
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

    const destroy$ = new Subject<void>()
    this.portalRef.onDestroy(() => destroy$.next())

    whenActive({
      element: this.portalRef.location.nativeElement,
      startEvents: ['mouseenter', 'focus'],
      endEvents: ['mouseleave', 'blur'],
      options: { passive: true },
    })
      .pipe(takeUntil(merge(destroy$, this.destroy$)))
      .subscribe({
        next: (value) => this.overlayActive$.next(value),
        complete: () => this.overlayActive$.next(false),
        error: () => this.overlayActive$.next(false),
      })
  }

  private hideTooltip() {
    const oRef = this.overlayRef
    const pRef = this.portalRef
    this.overlayRef = null
    this.portalRef = null
    if (oRef?.hasAttached()) {
      pRef.changeDetectorRef.markForCheck()
      oRef.detach()
      setTimeout(() => {
        oRef.dispose()
      }, 150)
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

function fromEvents(events: string[], el: HTMLElement, options: EventListenerOptions) {
  return merge(...events.map((it) => fromEvent(el, it, options)))
}

function whenActive({
  element,
  startEvents,
  endEvents,
  options,
}: {
  element: HTMLElement
  startEvents: string[]
  endEvents: string[]
  options: EventListenerOptions
}) {
  return fromEvents(startEvents, element, options).pipe(
    switchMap(() => {
      return merge(
        of(true),
        fromEvents(endEvents, element, options).pipe(
          take(1),
          map(() => false),
        ),
      )
    }),
  )
}

export interface EventListenerOptions {
  capture?: boolean
  passive?: boolean
  once?: boolean
}
