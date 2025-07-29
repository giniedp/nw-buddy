import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core'
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

  public readonly title = input<string>(undefined)
  public readonly body = input<string>(undefined)
  public readonly isHtml = input<boolean>(undefined)
  public readonly placeholder = input<string>(undefined)
  public readonly positive = input<string>(undefined)
  public readonly negative = input<string>(undefined)
  public readonly neutral = input<string>(undefined)
  public readonly inputType = input<'textarea' | 'text' | 'number' | 'password'>(undefined)
  public readonly min = input<number>(undefined)
  public readonly max = input<number>(undefined)
  public readonly value = model<T>(undefined)
  public readonly label = model<string>()

  private dialog = inject<ModalRef<T>>(ModalRef, { optional: true })

  public submit() {
    this.dialog?.close(this.value())
  }

  public abort() {
    this.dialog?.close(void 0)
  }

  public close() {
    this.dialog?.close(null)
  }
}
