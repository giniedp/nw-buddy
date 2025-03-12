import { NgTemplateOutlet } from '@angular/common'
import { Component, input } from '@angular/core'
import { TabsComponent } from './tabs.component'

@Component({
  selector: 'nwb-tabs-content',
  template: `
    @for (tab of tabs()?.tabs(); track $index) {
      @if (keepAlive() || tab.active()) {
        <div [ngTemplateOutlet]="tab.content()" class="col-start-1 row-start-1" [class.hidden]="!tab.active()"></div>
      }
    }
  `,
  host: {
    class: 'grid grid-cols-1 grid-rows-1',
  },
  imports: [NgTemplateOutlet],
  animations: [],
})
export class TabsContentComponent<T> {
  public tabs = input.required<TabsComponent<T>>()
  public keepAlive = input<boolean>()
}
