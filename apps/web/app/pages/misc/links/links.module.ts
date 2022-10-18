import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { LinksComponent } from './links.component'

const routes: Routes = [{ path: '', component: LinksComponent }]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class LinksModule {}
