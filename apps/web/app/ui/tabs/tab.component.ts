import { Component, computed, ElementRef, HostListener, inject, input, TemplateRef } from '@angular/core'
import { TabsStore } from './tabs.store'

@Component({
  standalone: true,
  selector: 'nwb-tab',
  template: ` <ng-content /> `,
  host: {
    class: 'tab',
    '[class.tab-active]': 'active()',
    role: 'tab',
    '[tabindex]': 'tabindex()',
  },
})
export class TabComponent {
  private store = inject(TabsStore)
  public tabindex = input<number>(0)
  public value = input<string | number>(null)
  public active = computed(() => this.store.active() === this.value())
  public content = input<TemplateRef<unknown>>(null)
  public elRef = inject<ElementRef<HTMLElement>>(ElementRef)

  @HostListener('click')
  protected onClicked() {
    this.store.activate(this.value())
  }

  @HostListener('keydown', ['$event'])
  protected onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.store.activate(this.value())
    }
  }
}
