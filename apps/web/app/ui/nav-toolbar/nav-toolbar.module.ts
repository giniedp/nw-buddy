import { NgModule } from '@angular/core'
import { NavToolbarComponent, NavToolbarButtonsComponent, NavToolbarMenuComponent } from './nav-toolbar.component'

const components = [NavToolbarButtonsComponent, NavToolbarComponent, NavToolbarMenuComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class NavToolbarModule {
  //
}
