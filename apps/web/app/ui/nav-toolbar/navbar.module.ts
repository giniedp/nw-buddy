import { NgModule } from '@angular/core'
import { NavbarComponent, NavbarButtonsDirective, NavbarMenuDirective } from './navbar.component'

const components = [NavbarComponent, NavbarButtonsDirective, NavbarMenuDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class NavbarModule {
  //
}
