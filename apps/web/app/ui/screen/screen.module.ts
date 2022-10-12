import { NgModule } from '@angular/core'
import { ScreenDrawerContentComponent } from './screen-drawer-content.component'
import { ScreenDrawerSideComponent } from './screen-drawer-side.component'
import { ScreenDrawerComponent } from './screen-drawer.component'
import { ScreenDrawerToggleDirective } from './screen-drawer.directive'

const COMPONENTS = [
  ScreenDrawerComponent,
  ScreenDrawerContentComponent,
  ScreenDrawerSideComponent,
  ScreenDrawerToggleDirective,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class ScreenModule {}
