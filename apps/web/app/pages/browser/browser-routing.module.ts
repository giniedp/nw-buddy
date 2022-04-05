import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { BrowserComponent } from './browser.component'

const routes: Routes = [{ path: '', component: BrowserComponent }]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class BrowserRoutingModule {}
