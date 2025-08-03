import { Directive, ElementRef, inject, Input, OnDestroy, OnInit } from '@angular/core'
import { ScreenshotFrame, ScreenshotService } from './screenshot.service'

@Directive({
  standalone: true,
  selector: '[nwbScreenshotFrame]',
})
export class ScreenshotFrameDirective implements ScreenshotFrame, OnInit, OnDestroy {
  private service = inject(ScreenshotService)
  public readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>)

  @Input()
  public nwbScreenshotIcon: string

  @Input()
  public nwbScreenshotFrame: string

  @Input()
  public nwbScreenshotLabel: string

  @Input()
  public nwbScreenshotWidth: number

  @Input()
  public nwbScreenshotMode: 'detached' | 'attached' = 'attached'

  public get name() {
    return this.nwbScreenshotFrame
  }

  public get icon() {
    return this.nwbScreenshotIcon
  }

  public get label() {
    return this.nwbScreenshotLabel
  }

  public get width() {
    return this.nwbScreenshotWidth
  }

  public get mode() {
    return this.nwbScreenshotMode
  }

  public constructor() {
    //
  }

  public ngOnInit(): void {
    this.service.register(this)
  }

  public ngOnDestroy(): void {
    this.service.unregister(this)
  }
}
