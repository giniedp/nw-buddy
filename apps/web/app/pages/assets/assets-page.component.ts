import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CodeEditorModule } from '~/ui/code-editor'
import { LayoutModule } from '~/ui/layout'

import { AssetsSidebarComponent } from './assets-sidebar.component'
import { AssetsStore } from './assets.store'

@Component({
  standalone: true,
  selector: 'nwb-assets-page',
  imports: [AssetsSidebarComponent, LayoutModule, CodeEditorModule, FormsModule],
  host: {
    class: 'ion-page flex flex-row',
  },
  template: `
    <ion-split-pane contentId="editor">
      <ion-menu contentId="editor" class="w-96 order-2">
        <nwb-assets-sidebar class="w-96 ion-page h-full" />
      </ion-menu>
      <div class="ion-page order-1" id="editor">
        <ion-header>
          <ion-toolbar>
            <ion-title>Assets</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content [scrollY]="false"> </ion-content>
        <!-- <ion-footer></ion-footer> -->
      </div>
    </ion-split-pane>
  `,
})
export class AssetsPageComponent {
  private store = inject(AssetsStore)
}
