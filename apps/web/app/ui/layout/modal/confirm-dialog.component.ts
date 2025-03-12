import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, Optional } from '@angular/core'
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

  @Input()
  public title: string

  @Input()
  public body: string

  @Input()
  public isHtml: boolean

  @Input()
  public positive: string

  @Input()
  public negative: string

  @Input()
  public neutral: string

  public constructor(
    @Optional()
    private dialog: ModalRef<boolean>,
  ) {
    //
  }

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
