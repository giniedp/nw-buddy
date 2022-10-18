import { NgModule } from '@angular/core'
import { TabMenuComponent, TabMenuContent } from './tab-menu.component'

@NgModule({
  imports: [TabMenuComponent, TabMenuContent],
  exports: [TabMenuComponent, TabMenuContent],
})
export class TabMenuModule {
  //
}
