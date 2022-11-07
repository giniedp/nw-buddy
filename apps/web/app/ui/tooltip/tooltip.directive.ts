import { ComponentRef, Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { createPopper, Instance, Placement } from '@popperjs/core';
import { fromEvent, merge, Subject, takeUntil } from 'rxjs';
import { TooltipComponent } from './tooltip.component';

@Directive({
  standalone: true,
  selector: '[tooltip]',
})
export class TooltipDirective implements OnInit, OnDestroy {

  @Input()
  public tooltip: string | TemplateRef<any>

  @Input()
  public color: '' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'

  @Input()
  public placement: Placement = 'top'

  @Input()
  public target: ElementRef<HTMLElement>

  private destroy$ = new Subject<void>()
  private cRef: ComponentRef<TooltipComponent>
  private instance: Instance

  public constructor(private elRef: ElementRef<HTMLElement>, private vcRef: ViewContainerRef, private zone: NgZone) {
    this.target = elRef
  }

  public ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      const open$ = fromEvent(this.elRef.nativeElement, 'mouseenter')
      const close$ =  merge(...["touchend", "touchcancel", "mouseleave"].map((it) => fromEvent(this.elRef.nativeElement, it)))

      open$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.show()
        })

      close$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.close()
        })
    })

  }

  public ngOnDestroy(): void {
    this.close()
    this.destroy$.next()
    this.destroy$.complete()
  }

  private show() {
    this.close()
    this.zone.run(() => {
      this.cRef = this.vcRef.createComponent(TooltipComponent)
      this.cRef.instance.content = this.tooltip
      this.cRef.instance.color = this.color
      this.cRef.changeDetectorRef.detectChanges()
    })
    this.instance = createPopper((this.target || this.elRef).nativeElement, this.cRef.location.nativeElement, {
      placement: this.placement || 'top',
      strategy: 'fixed',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [5, 5],
          },
        },
      ],
      onFirstUpdate: () => {
        this.zone.run(() => {
          this.cRef.instance.show = true
          this.cRef.changeDetectorRef.detectChanges()
          this.instance?.forceUpdate()
        })
      }
    })
    setTimeout(() => this.instance?.forceUpdate())
  }

  private close() {
    this.zone.run(() => {
      this.instance?.destroy()
      this.instance = null
      this.cRef?.destroy()
      this.cRef = null
    })
  }
}
