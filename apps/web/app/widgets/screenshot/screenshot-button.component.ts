import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectorRef, Component, HostBinding, HostListener, TemplateRef, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ScreenshotFrame, ScreenshotService } from './screenshot.service'

@Component({
  standalone: true,
  selector: 'nwb-screenshot-button,[nwbScreenshotBtn]',
  templateUrl: './screenshot-button.component.html',
  imports: [CommonModule, FormsModule, OverlayModule, DialogModule],
  host: {
    class: 'flex',
  }
})
export class ScreenshotButtonComponent {
  @HostBinding('class.disabled')
  @HostBinding('class.opacity-25')
  @HostBinding('attr.disabled')
  public get disabled() {
    return (this.isBusy || !this.frames.length) ? true : null
  }

  protected get frames() {
    return this.service.frames
  }

  protected isOverlayOpen = false
  protected isBusy = false
  protected dialogRef: DialogRef<'download' | 'clipboard'>
  @ViewChild('saveDialog')
  protected saveDialog: TemplateRef<any>

  public constructor(
    private service: ScreenshotService,
    private dialog: Dialog,
    private cdRef: ChangeDetectorRef
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
    this.dialog.closeAll()
    this.dialogRef = this.dialog.open(this.saveDialog, {
      minWidth: '300px',
    })
    this.dialogRef.closed.subscribe((value) => {
      if (value === 'download') {
        this.service.saveBlobToFile(blob, frame.description)
      }
      if (value === 'clipboard') {
        this.service.saveBlobToClipoard(blob)
      }
    })
  }
}
