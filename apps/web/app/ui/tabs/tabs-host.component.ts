import { Component, contentChild } from '@angular/core'
import { TabsContentComponent } from './tabs-content.component'

import { TabsComponent } from './tabs.component'

@Component({
  selector: 'nwb-tabs-host',
  template: `
    <div class="tabs-header-start">
      <ng-content select="[slot='start'],nwb-tab-left" />
    </div>
    <ng-content select="nwb-tabs" />
    <div class="tabs-header-end">
      <ng-content select="[slot='end'],nwb-tab-right" />
    </div>
    <div class="tabs-content">
      <nwb-tabs-content [tabs]="tabs()" />
      <ng-content />
    </div>
  `,
  styleUrl: './tabs-host.component.css',
  imports: [TabsContentComponent],
  exportAs: 'tabsHost',
})
export class TabsHostComponent<T> {
  public tabs = contentChild(TabsComponent<T>)
}
