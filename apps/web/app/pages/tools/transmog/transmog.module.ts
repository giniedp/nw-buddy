import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TransmogDetailPageComponent } from './transmog-detail-page.component'
import { TransmogPageComponent } from './transmog-page.component'
import { TransmogEditorPageComponent } from './transmog-editor-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: 'editor',
    component: TransmogEditorPageComponent
  },
  {
    path: ':category',
    component: TransmogPageComponent,
    children: [
      {
        path: ':id',
        component: TransmogDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
})
export class TransmogModule {}
