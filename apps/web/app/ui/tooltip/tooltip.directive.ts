import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay'
import { ComponentPortal } from '@angular/cdk/portal'
import {
  ComponentRef,
  Directive,
  ElementRef,
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
  public tooltipPlacement: TooltipDirection = 'auto'

  @Input()
  public tooltipTrigger: TooltipTriggerType = 'hover'

  @Input()
  public color: string = null

  @Input()
  public tooltipClass: string | string[] = null

  @Input()
  public tooltipScrollStrategy: TooltipScrollStrategy = 'reposition'

  @Input()
  public tooltipDelay: number = 150

  @Input()
  public tooltipOffset: number = 4

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
            return merge(close$, of(true).pipe(delay(this.tooltipDelay)).pipe(takeUntil(close$)))
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
    if (this.tooltipClass || this.color) {
      this.portalRef.instance.ngClass = this.tooltipClass || this.color
    }
    this.portalRef.instance.content = this.tooltip
    this.portalRef.instance.context = this.tooltipContext
    this.portalRef.changeDetectorRef.markForCheck()
    this.portalRef.changeDetectorRef.detectChanges()
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
    if (this.tooltipScrollStrategy === 'reposition') {
      overlayState.scrollStrategy = this.overlay.scrollStrategies.reposition()
    } else {
      overlayState.scrollStrategy = this.overlay.scrollStrategies.close()
    }
    overlayState.scrollStrategy.enable()
    return this.overlay.create(overlayState)
  }

  private getPosition() {
    let strategy = this.overlay.position().flexibleConnectedTo(this.elRef)

    if (this.tooltipPlacement === 'top') {
      strategy = strategy
        .withPositions([{ originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' }])
        .withDefaultOffsetY(-this.tooltipOffset)
    }
    if (this.tooltipPlacement === 'right') {
      strategy = strategy
        .withPositions([{ originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' }])
        .withDefaultOffsetX(this.tooltipOffset)
    }
    if (this.tooltipPlacement === 'bottom') {
      strategy = strategy
        .withPositions([{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' }])
        .withDefaultOffsetY(this.tooltipOffset)
    }
    if (this.tooltipPlacement === 'left') {
      strategy = strategy
        .withPositions([{ originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' }])
        .withDefaultOffsetX(-this.tooltipOffset)
    }
    if (this.tooltipPlacement === 'auto') {
      strategy = strategy
        .withPositions([
          { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
          { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
          { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' },
        ])
        .withPush(true)
    }
    return strategy
  }
}
