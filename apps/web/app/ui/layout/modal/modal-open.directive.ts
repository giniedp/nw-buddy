import { Directive, HostListener, Input, inject } from '@angular/core'
import { ModalOpenOptions, ModalRef, ModalService } from './modal.service'

@Directive({
  standalone: true,
  selector: '[nwbModalOpen]',
})
export class ModalOpenDirective {
  @Input()
  public nwbModalOpen: ModalOpenOptions<any>

  private service = inject(ModalService)

  @HostListener('click')
  public handleClick() {
    this.service.open(this.nwbModalOpen)
  }
}
