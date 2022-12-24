import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { Web3Component } from './web3.component'


export const routes: Routes = [
  {
    path: ':cid',
    component: Web3Component,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
})
export class Web3Module {
  //
}
