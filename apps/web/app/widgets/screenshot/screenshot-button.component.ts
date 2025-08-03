import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { Component, computed, HostListener, inject, input, Input, signal, TemplateRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SvgIconComponent } from '../../ui/icons'
import { ScreenshotFrame, ScreenshotService } from './screenshot.service'

@Component({
  selector: 'nwb-screenshot-button,[nwbScreenshotBtn]',
  templateUrl: './screenshot-button.component.html',
  imports: [CommonModule, FormsModule, OverlayModule, SvgIconComponent],
  host: {
    class: 'flex',
    '[class.disabled]': 'isDisabled()',
    '[attr.disabled]': 'isDisabled()',
  },
})
export class ScreenshotButtonComponent {
  private service = inject(ScreenshotService)

  public nwbScreenshotBtn = input<void>()

  public screenshotMenu = input<TemplateRef<any>>()

  public nwbScreenshotBtnDelay = input<number>()

  public disabled = input<boolean>(false)

  protected isDisabled = computed(() => {
    return this.disabled() || this.isBusy() || !this.frames.length ? true : null
  })

  protected get frames() {
    return this.service.frames
  }

  protected isOverlayOpen = signal(false)
  protected isBusy = signal(false)

  @HostListener('click', ['$event'])
  protected async clicked(e: MouseEvent) {
    if (this.disabled()) {
      return
    }
    if (this.frames.length > 1) {
      this.isOverlayOpen.set(!this.isOverlayOpen())
      return
    }
    this.makeScreenshot(this.frames[0])
  }

  protected async makeScreenshot(frame: ScreenshotFrame) {
    if (this.nwbScreenshotBtnDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.nwbScreenshotBtnDelay()))
    }
    this.isBusy.set(true)
    await this.grabScreenshot(frame).catch(console.error)
    this.isBusy.set(false)
  }

  protected async grabScreenshot(frame: ScreenshotFrame) {
    this.isOverlayOpen.set(false)
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
