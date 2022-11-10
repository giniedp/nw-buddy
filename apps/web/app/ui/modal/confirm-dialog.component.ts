import { Dialog, DialogConfig, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'

export interface ConfirmDialogOptions {
  title: string
  body: string
  html?: boolean
  positive: string
  negative?: string
  neutral?: string
}

@Component({
  standalone: true,
  selector: 'nwb-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'd-block bg-base-100 rounded-md p-3',
  },
})
export class ConfirmDialogComponent {
  public static open(dialog: Dialog, config: DialogConfig<ConfirmDialogOptions, DialogRef<boolean | null, ConfirmDialogComponent>>) {
    return dialog.open(ConfirmDialogComponent, {
      maxWidth: 600,
      maxHeight: 800,
      minHeight: 320,
      minWidth: 300,
      ...config
    })
  }

  protected get title() {
    return this.data.title
  }

  protected get body() {
    return this.data.body
  }

  protected get isHtml() {
    return this.data.html
  }

  protected get positive() {
    return this.data.positive
  }

  protected get negative() {
    return this.data.negative
  }

  protected get neutral() {
    return this.data.neutral
  }

  public constructor(
    @Inject(DIALOG_DATA)
    private data: ConfirmDialogOptions,
    private dialog: DialogRef<boolean | null>
  ) {

  }

  public confirm() {
    this.dialog.close(true)
  }

  public deny() {
    this.dialog.close(false)
  }

  public close() {
    this.dialog.close(null)
  }
}
