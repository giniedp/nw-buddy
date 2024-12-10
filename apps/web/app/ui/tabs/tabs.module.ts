import { NgModule } from '@angular/core'
import { TabComponent } from './tab.component'
import { TabsContentComponent } from './tabs-content.component'
import { TabsComponent } from './tabs.component'
import { TabsHostComponent } from './tabs-host.component'
import { TabControlComponent } from './tab-control.component'

const COMPONENTS = [TabsHostComponent, TabsComponent, TabControlComponent, TabComponent, TabsContentComponent]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class TabsModule {}
