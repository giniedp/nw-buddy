import { Directive, HostListener, TemplateRef, inject, input } from '@angular/core'
import { PopoverController } from '@ionic/angular/standalone'
import { PopoverComponent } from './popover.component'

@Directive({
  standalone: true,
  selector: '[popover]',
  exportAs: 'popover',
})
export class PopoverDirective {
  private controller = inject(PopoverController)
  public popover = input<TemplateRef<any>>()

  @HostListener('click', ['$event'])
  protected async presentPopover(e: Event) {
    if (!this.popover()) {
      return
    }
    const popover = await this.controller.create({
      component: PopoverComponent,
      componentProps: { content: this.popover() },
      event: e,
    })
    popover.style.setProperty('--width', 'auto')
    await popover.present()
  }

  public close() {
    this.controller.dismiss()
  }
}
