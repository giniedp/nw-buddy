import { NgModule } from '@angular/core'
import { NavToolbarComponent, NavToobalButtonsComponent, NavToobalMenuComponent } from './nav-toolbar.component'

const components = [NavToobalButtonsComponent, NavToolbarComponent, NavToobalMenuComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class NavToobalModule {
  //
}
