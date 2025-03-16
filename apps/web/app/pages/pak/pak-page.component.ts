import { Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CodeEditorModule } from '~/ui/code-editor'
import { LayoutModule } from '~/ui/layout'

import { httpResource } from '@angular/common/http'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { IonButton, IonButtons } from '@ionic/angular/standalone'
import { map } from 'rxjs'
import { ItemModelInfo, ModelViewerModule } from '~/widgets/model-viewer'
import { PakSidebarComponent } from './pak-sidebar.component'
import { PakService } from './pak.service'

@Component({
  standalone: true,
  selector: 'nwb-assets-page',
  imports: [PakSidebarComponent, LayoutModule, CodeEditorModule, FormsModule, IonButton, IonButtons, ModelViewerModule],
  host: {
    class: 'ion-page flex flex-row',
  },
  template: `
    <ion-split-pane contentId="editor">
      <ion-menu contentId="editor" class="w-96 order-2">
        <nwb-assets-sidebar class="w-96 ion-page h-full" />
      </ion-menu>
      <div class="ion-page order-1" id="editor">
        <ion-header class="bg-base-300">
          <ion-toolbar>
            <ion-title>Pak Browser</ion-title>
            <ion-buttons collapse="true" slot="end">

            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        @if (stat(); as stat) {
          <ion-content [scrollY]="false">
            @if (stat.textUrl) {
              <nwb-code-editor
                class="ion-page"
                [ngModel]="textContent.value()"
                [language]="stat.textType"
                [disabled]="true"
              />
            } @else if (stat.imageUrl) {
              <picture class="ion-page">
                <img [src]="stat.imageUrl" class="object-scale-down" />
              </picture>
            } @else if (modelContent()) {
              <nwb-model-viewer class="h-full" [models]="modelContent()" />
            }
          </ion-content>
        }
      </div>
    </ion-split-pane>
  `,
})
export class PakPageComponent {
  private service = inject(PakService)
  private route = inject(ActivatedRoute)
  private file = toSignal(this.route.queryParams.pipe(map((params) => params['file'] as string)))
  protected stat = computed(() => this.service.fileStats(this.file()))

  protected textContent = httpResource.text(() => this.stat()?.textUrl)
  protected modelContent = computed((): ItemModelInfo[] => {
    const modelUrl = this.stat()?.modelUrl
    if (!modelUrl) {
      return null
    }
    return [
      {
        itemId: null,
        label: null,
        name: null,
        url: modelUrl,
        itemClass: null,
        appearance: null,
      },
    ]
  })
}
