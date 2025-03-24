import { Directive, HostListener, inject, input } from '@angular/core'
import { ModalRef, ModalService } from './modal.service'

@Directive({
  standalone: true,
  selector: '[nwbModalClose]',
})
export class ModalCloseDirective<T> {
  public readonly nwbModalClose = input<T>(undefined)

  private ref = inject(ModalRef<T>, { optional: true })
  private service = inject(ModalService)

  @HostListener('click')
  public handleClick() {
    if (this.ref) {
      this.ref.close(this.nwbModalClose())
    } else {
      this.service.close()
    }
  }
}
