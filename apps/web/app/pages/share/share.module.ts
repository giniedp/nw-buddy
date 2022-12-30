import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ShareComponent } from './share.component'


export const routes: Routes = [
  {
    path: ':cid',
    component: ShareComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
})
export class ShareModule {
  //
}
