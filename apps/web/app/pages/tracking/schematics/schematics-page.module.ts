import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { SchematicsPageComponent } from './schematics-page.component'
import { SchematicsTrackingComponent } from './schematics-tracking.component'

const ROUTES: Routes = [
  {
    path: '',
    component: SchematicsPageComponent,
    children: [
      {
        path: ':category',
        component: SchematicsTrackingComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class SchematicPageModule {}
