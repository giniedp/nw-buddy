import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'

export interface ScreenshotSaveOption {
  action: 'clipboard' | 'download'
  filename: string
}

@Component({
  selector: 'nwb-screenshot-save-dialog',
  templateUrl: './screenshot-save-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, LayoutModule],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class ScreenshotSaveDialogComponent {
  public static open(modal: ModalService, options: ModalOpenOptions<ScreenshotSaveDialogComponent>) {
    options.content = ScreenshotSaveDialogComponent
    return modal.open<ScreenshotSaveDialogComponent, ScreenshotSaveOption>(options)
  }

  @Input()
  public previewUrl: string
  @Input()
  public filename: string
  @Input()
  public enableClipboard: boolean

  public constructor(private modalRef: ModalRef<ScreenshotSaveOption>) {
    //
  }

  protected close(value: ScreenshotSaveOption['action'] = null) {
    this.modalRef.close({
      action: value,
      filename: this.filename,
    })
  }
}
