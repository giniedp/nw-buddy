import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { DmgSandboxPageComponent } from './dmg-sandbox-page.component'

const routes: Routes = [
  {
    path: '',
    component: DmgSandboxPageComponent,
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class DmgSandbocModule {}
