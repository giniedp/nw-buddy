import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, Optional } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonContent, IonFooter, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone'
import { IonContentDirective } from '../ion-content.directive'
import { ModalOpenOptions, ModalRef, ModalService } from './modal.service'

export type PromptDialogOptions<T extends string | number> = Pick<
  PromptDialogComponent<T>,
  | 'title'
  | 'body'
  | 'isHtml'
  | 'placeholder'
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'inputType'
  | 'min'
  | 'max'
  | 'value'
>

@Component({
  selector: 'nwb-prompt-dialog',
  templateUrl: './prompt-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IonContent, IonContentDirective, IonFooter, IonHeader, IonToolbar, IonTitle],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class PromptDialogComponent<T extends string | number> {
  public static open<T extends string | number>(
    modal: ModalService,
    options: ModalOpenOptions<PromptDialogComponent<T>>,
  ) {
    options.size ??= ['y-auto', 'x-sm']
    options.content = PromptDialogComponent
    return modal.open<PromptDialogComponent<T>, T>(options)
  }

  @Input()
  public title: string

  @Input()
  public body: string

  @Input()
  public isHtml: boolean

  @Input()
  public placeholder: string

  @Input()
  public positive: string

  @Input()
  public negative: string

  @Input()
  public neutral: string

  @Input()
  public inputType: 'textarea' | 'text' | 'number' | 'password'

  @Input()
  public min: number

  @Input()
  public max: number

  @Input()
  public value: T

  public constructor(
    @Optional()
    private dialog: ModalRef<T>,
  ) {}

  public submit() {
    this.dialog?.close(this.value)
  }

  public abort() {
    this.dialog?.close(void 0)
  }

  public close() {
    this.dialog?.close(null)
  }
}
