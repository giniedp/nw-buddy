import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectorRef, Component, HostBinding, HostListener, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ScreenshotFrame, ScreenshotService } from './screenshot.service'

@Component({
  standalone: true,
  selector: 'nwb-screenshot-button,[nwbScreenshotBtn]',
  templateUrl: './screenshot-button.component.html',
  imports: [CommonModule, FormsModule, OverlayModule],
  host: {
    class: 'flex',
  },
})
export class ScreenshotButtonComponent {
  @Input()
  public nwbScreenshotBtn: void

  @Input()
  public nwbScreenshotBtnDelay: number

  @HostBinding('class.disabled')
  @HostBinding('class.opacity-25')
  @HostBinding('attr.disabled')
  public get disabled() {
    return this.isBusy || !this.frames.length ? true : null
  }

  protected get frames() {
    return this.service.frames
  }

  protected isOverlayOpen = false
  protected isBusy = false

  public constructor(
    private service: ScreenshotService,
    private cdRef: ChangeDetectorRef,
  ) {
    //
  }

  @HostListener('click', ['$event'])
  protected async clicked(e: MouseEvent) {
    if (this.disabled) {
      return
    }
    if (this.frames.length > 1) {
      this.isOverlayOpen = !this.isOverlayOpen
      return
    }
    this.makeScreenshot(this.frames[0])
  }

  protected async makeScreenshot(frame: ScreenshotFrame) {
    if (this.nwbScreenshotBtnDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.nwbScreenshotBtnDelay))
    }
    this.isBusy = true
    await this.grabScreenshot(frame).catch(console.error)
    this.isBusy = false
    this.cdRef.markForCheck()
  }

  protected async grabScreenshot(frame: ScreenshotFrame) {
    this.isOverlayOpen = false
    if (!frame) {
      return
    }
    const blob = await this.service.makeScreenshot(frame)
    if (!blob) {
      return
    }
    this.service.saveBlobWithDialog(blob, frame.name)
  }
}
