import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'

export interface ScreenshotSaveDialogData {
  previewUrl: string
  filename: string
}

export interface ScreenshotSaveOption {
  action: 'clipboard' | 'download'
  filename: string
}

@Component({
  standalone: true,
  selector: 'nwb-screenshot-save-dialog',
  templateUrl: './screenshot-save-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule],
  host: {
    class: 'flex flex-col h-full bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class ScreenshotSaveDialogComponent {
  public static open(dialog: Dialog, config: DialogConfig<ScreenshotSaveDialogData>) {
    return dialog.open<ScreenshotSaveOption, ScreenshotSaveDialogData, ScreenshotSaveDialogComponent>(
      ScreenshotSaveDialogComponent,
      {
        panelClass: ['max-h-screen', 'w-screen', 'max-w-xl', 'm-2', 'shadow', 'self-end', 'sm:self-center'],
        ...config,
      }
    )
  }

  protected previewUrl: string
  protected filename: string

  public constructor(
    private dialog: DialogRef<ScreenshotSaveOption, ScreenshotSaveDialogData>,
    @Inject(DIALOG_DATA)
    data: ScreenshotSaveDialogData
  ) {
    this.previewUrl = data.previewUrl
    this.filename = data.filename
  }

  protected close(value: ScreenshotSaveOption['action'] = null) {
    this.dialog.close({
      action: value,
      filename: this.filename,
    })
  }
}
