import { Dialog, DialogConfig, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { firstValueFrom } from 'rxjs'
import { CodeEditorModule } from '~/ui/code-editor'

export interface EditorDialogOptions {
  title: string
  value: string
  valueUrl?: string
  language?: string
  readonly?: boolean
  positive: string
  negative?: string
  neutral?: string
}

@Component({
  standalone: true,
  selector: 'nwb-editor-dialog',
  templateUrl: './editor-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CodeEditorModule, FormsModule],
  host: {
    class: 'flex flex-col h-full bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class EditorDialogComponent {
  public static open(dialog: Dialog, config: DialogConfig<EditorDialogOptions, DialogRef<string, EditorDialogComponent>>) {
    return dialog.open(EditorDialogComponent, {
      maxWidth: 1200,
      panelClass: ['w-full', 'h-full', 'layout-pad', 'self-end', 'sm:self-center', 'shadow'],
      ...config
    })
  }

  protected get title() {
    return this.data.title
  }

  protected get readonly() {
    return this.data.readonly
  }

  protected get language() {
    return this.data.language
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
    private data: EditorDialogOptions,
    private dialog: DialogRef<string>,
    private http: HttpClient,
    private cdRef: ChangeDetectorRef
  ) {
    this.value = data.value
    this.fetchValue()
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

  private async fetchValue() {
    if (!this.data.valueUrl) {
      return
    }
    this.value = await firstValueFrom(this.http.get(this.data.valueUrl, {
      responseType: 'text'
    }))
    this.cdRef.markForCheck()
  }
}
