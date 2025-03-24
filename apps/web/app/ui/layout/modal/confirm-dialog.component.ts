import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { IonContent, IonFooter, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone'
import { IonContentDirective } from '../ion-content.directive'
import { ModalOpenOptions, ModalRef, ModalService } from './modal.service'

export type ConfirmDialogOptions = Pick<
  ConfirmDialogComponent,
  'title' | 'body' | 'isHtml' | 'positive' | 'negative' | 'neutral'
>

@Component({
  selector: 'nwb-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonContent, IonContentDirective, IonFooter, IonHeader, IonToolbar, IonTitle],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class ConfirmDialogComponent {
  public static open(modal: ModalService, options: ModalOpenOptions<ConfirmDialogComponent>) {
    options.size ??= ['y-auto', 'x-sm']
    options.content = ConfirmDialogComponent
    return modal.open<ConfirmDialogComponent, boolean | null>(options)
  }
  private dialog = inject<ModalRef<boolean>>(ModalRef, { optional: true })
  public readonly title = input<string>(undefined)
  public readonly body = input<string>(undefined)
  public readonly isHtml = input<boolean>(undefined)
  public readonly positive = input<string>(undefined)
  public readonly negative = input<string>(undefined)
  public readonly neutral = input<string>(undefined)

  public confirm() {
    this.dialog?.close(true)
  }

  public deny() {
    this.dialog?.close(false)
  }

  public close() {
    this.dialog?.close(null)
  }
}
