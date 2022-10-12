import { Directive, HostListener, Input } from "@angular/core"
import { ScreenDrawerService } from "./screen-drawer.service";

@Directive({
  standalone: true,
  selector: '[nwbScreenDrawerToggle]'
})
export class ScreenDrawerToggleDirective {

  @Input('nwbScreenDrawerToggle')
  public action: 'toggle' | 'close' | 'open' = 'toggle'

  public constructor(private service: ScreenDrawerService) {
    console.log(this)
  }

  @HostListener('click')
  public onClick() {
    if (this.action === 'toggle') {
      this.service.toggle()
    }
    if (this.action === 'close') {
      this.service.close()
    }
    if (this.action === 'open') {
      this.service.open()
    }
  }
}
