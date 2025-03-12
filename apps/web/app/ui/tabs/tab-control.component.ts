import { Component, computed, ElementRef, HostListener, inject, input } from '@angular/core'
import { IconsModule } from '../icons'
import { svgChevronLeft, svgChevronRight } from '../icons/svg'
import { TabsHostComponent } from './tabs-host.component'

@Component({
  selector: 'nwb-tab-left,nwb-tab-right',
  template: ` <nwb-icon [icon]="usedIcon()" class="w-4 h-4" /> `,
  host: {
    role: 'button',
    '[attr.disabled]': 'disabled() ? "disabled" : null',
  },
  imports: [IconsModule],
})
export class TabControlComponent {
  private host = inject(TabsHostComponent)
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  private isLeft = this.elRef.nativeElement.tagName === 'NWB-TAB-LEFT'
  private isRight = this.elRef.nativeElement.tagName === 'NWB-TAB-RIGHT'

  public icon = input<string>()
  public disabled = input<boolean>()
  protected usedIcon = computed(() => {
    let icon = this.icon()
    if (!icon) {
      icon = this.isLeft ? svgChevronLeft : svgChevronRight
    }
    return icon
  })
  @HostListener('click')
  protected handleClick() {
    if (this.isLeft) {
      this.host.tabs().scrollLeft()
    } else if (this.isRight) {
      this.host.tabs().scrollRight()
    }
  }
}
