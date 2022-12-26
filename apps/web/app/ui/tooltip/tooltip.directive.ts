import { ConnectedPosition, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay'
import { ComponentPortal, DomPortal, Portal, TemplatePortal } from '@angular/cdk/portal'
import {
  ChangeDetectorRef,
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
import { delay, distinctUntilChanged, fromEvent, map, merge, of, Subject, switchMap, takeUntil } from 'rxjs'
import { TooltipComponent } from './tooltip.component'

export declare type TooltipDirectionX = 'left' | 'right'
export declare type TooltipDirectionY = 'top' | 'bottom'

export declare type TooltipDirection =
  | TooltipDirectionX
  | TooltipDirectionY
  | `${TooltipDirectionX}-${TooltipDirectionY}`
  | `${TooltipDirectionY}-${TooltipDirectionX}`
export declare type TooltipTriggerType = 'click' | 'hover'
export declare type TooltipScrollStrategy = 'close' | 'reposition'

@Directive({
  standalone: true,
  selector: '[tooltip]',
  exportAs: 'tooltip',
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input('tooltip')
  public tooltip: string | TemplateRef<any> | Type<any>

  @Input('tooltipPlacement')
  public placement: TooltipDirection = 'top'

  @Input('tooltipTrigger')
  public trigger: TooltipTriggerType = 'hover'

  @Input('color')
  public color: string = null

  @Input('tooltipScrollStrategy')
  public scrollStrategy: TooltipScrollStrategy = 'reposition'

  @Input('tooltipDelay')
  public delay: number = 150

  @Input('tooltipOffset')
  public offset: number = 4

  private destroy$ = new Subject<void>()

  private overlayRef: OverlayRef
  private portal: ComponentPortal<TooltipComponent>
  private portalRef: ComponentRef<TooltipComponent>

  public constructor(
    private elRef: ElementRef,
    private vcRef: ViewContainerRef,
    private overlay: Overlay,
    private zone: NgZone
  ) {}

  public ngOnDestroy(): void {
    this.destroy$.next()
  }

  public ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      const open$ = merge(
        ...['mouseenter'].map((it) =>
          fromEvent(this.elRef.nativeElement, it, {
            passive: true,
          })
        )
      ).pipe(map(() => true))

      const close$ = merge(
        ...['touchend', 'touchcancel', 'mouseleave', 'blur'].map((it) =>
          fromEvent(this.elRef.nativeElement, it, {
            passive: true,
          })
        )
      ).pipe(map(() => false))

      open$
        .pipe(
          switchMap(() => {
            return merge(close$, of(true).pipe(delay(this.delay)).pipe(takeUntil(close$)))
          })
        )
        .pipe(distinctUntilChanged())
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          this.zone.run(() => {
            if (value) {
              this.open()
            } else {
              this.close()
            }
          })
        })
    })
  }

  protected open(): void {
    if (this.overlayRef?.hasAttached()) {
      return
    }
    this.overlayRef = this.overlayRef || this.createOverlay()
    this.portal = this.portal || new ComponentPortal(TooltipComponent, this.vcRef)
    this.portalRef = this.overlayRef.attach(this.portal)
    this.portalRef.instance.content = this.tooltip
    this.portalRef.instance.color = this.color as any
    this.portalRef.changeDetectorRef.markForCheck()
  }

  private close(): void {
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
    overlayState.positionStrategy = this.getPosition()
    if (this.scrollStrategy === 'reposition') {
      overlayState.scrollStrategy = this.overlay.scrollStrategies.reposition()
    } else {
      overlayState.scrollStrategy = this.overlay.scrollStrategies.close()
    }
    overlayState.scrollStrategy.enable()
    return this.overlay.create(overlayState)
  }

  private getPosition() {
    let strategy = this.overlay.position().flexibleConnectedTo(this.elRef)
    const [x, y] = this.placement.split('-')
    // const position: Partial<ConnectedPosition>  = {

    // }

    // if (!y) {

    // } else {

    // }
    if (this.placement === 'right') {
      strategy = strategy
        .withPositions([{ originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' }])
        .withDefaultOffsetX(this.offset)
    }
    if (this.placement === 'left') {
      strategy = strategy
        .withPositions([{ originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' }])
        .withDefaultOffsetX(-this.offset)
    }
    if (this.placement === 'top') {
      strategy = strategy
        .withPositions([{ originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' }])
        .withDefaultOffsetY(-this.offset)
    }
    if (this.placement === 'bottom') {
      strategy = strategy
        .withPositions([{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' }])
        .withDefaultOffsetY(this.offset)
    }
    return strategy
  }
}
