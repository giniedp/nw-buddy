import { Dialog, DialogConfig, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { FormsModule } from '@angular/forms'

export interface PromptDialogOptions {
  title: string
  body: string
  html?: boolean
  input?: string
  placeholder?: string
  positive: string
  negative: string
  neutral?: string
}

@Component({
  standalone: true,
  selector: 'nwb-prompt-dialog',
  templateUrl: './prompt-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  host: {
    class: 'd-block bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class PromptDialogComponent {
  public static open(dialog: Dialog, config: DialogConfig<PromptDialogOptions, DialogRef<string | null, PromptDialogComponent>>) {
    return dialog.open(PromptDialogComponent, {
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

  protected get placeholder() {
    return this.data.placeholder
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

  protected value: string

  public constructor(
    @Inject(DIALOG_DATA)
    private data: PromptDialogOptions,
    private dialog: DialogRef<string | null>
  ) {
    this.value = data.input
  }

  public submit() {
    this.dialog.close(this.value)
  }

  public abort() {
    this.dialog.close(void 0)
  }

  public close() {
    this.dialog.close(null)
  }
}
