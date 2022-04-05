import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { CharacterComponent } from './character.component'

const routes: Routes = [{ path: '', component: CharacterComponent }]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class CharacterRoutingModule {}
