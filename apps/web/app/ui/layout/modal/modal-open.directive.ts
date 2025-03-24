import { Directive, HostListener, inject, input } from '@angular/core'
import { ModalOpenOptions, ModalService } from './modal.service'

@Directive({
  standalone: true,
  selector: '[nwbModalOpen]',
})
export class ModalOpenDirective {
  private service = inject(ModalService)
  public readonly nwbModalOpen = input<ModalOpenOptions<any>>(undefined)

  @HostListener('click')
  public handleClick() {
    this.service.open(this.nwbModalOpen())
  }
}
