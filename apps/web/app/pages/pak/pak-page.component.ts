import { Component, computed, inject, linkedSignal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CodeEditorModule } from '~/ui/code-editor'
import { LayoutModule } from '~/ui/layout'

import { httpResource } from '@angular/common/http'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { map } from 'rxjs'
import { ModelItemInfo, ModelViewerModule } from '~/widgets/model-viewer'
import { PakSidebarComponent } from './pak-sidebar.component'
import { PakService } from './pak.service'
import { SplitGutterComponent, SplitPaneDirective } from '~/ui/split-container'

@Component({
  standalone: true,
  selector: 'nwb-assets-page',
  imports: [
    PakSidebarComponent,
    LayoutModule,
    CodeEditorModule,
    FormsModule,
    ModelViewerModule,
    SplitPaneDirective,
    SplitGutterComponent,
  ],
  host: {
    class: 'ion-page flex flex-row',
  },
  template: `
    <ion-split-pane contentId="editor">
      <ion-menu contentId="editor" class="min-w-96 max-w-screen-md order-3" [nwbSplitPane]="gutter">
        <nwb-assets-sidebar class="ion-page" />
      </ion-menu>
      <nwb-split-gutter class="order-2" #gutter="gutter" />
      <div class="ion-page order-1" id="editor">
        <ion-header class="bg-base-300">
          <ion-toolbar>
            <ion-title>Pak Browser</ion-title>
            @if (showModelButton()) {
              <div slot="end" class="join">
                <button class="join-item btn btn-ghost" (click)="showModel.set(false)">TXT</button>
                <button class="join-item btn btn-ghost" (click)="showModel.set(true)">3D</button>
              </div>
            }
          </ion-toolbar>
        </ion-header>
        @if (source(); as source) {
          <ion-content [scrollY]="false">
            @switch (previewType()) {
              @case ('3D') {
                <nwb-model-viewer class="h-full" [models]="modelContent()" />
              }
              @case ('TXT') {
                <nwb-code-editor
                  class="ion-page"
                  [ngModel]="textContent.value()"
                  [language]="source.textType"
                  [disabled]="true"
                />
              }
              @case ('IMG') {
                <picture class="block relative">
                  <img [src]="source.baseUrl + source.imagePath" class="object-scale-down" #img />
                  @if (img.naturalWidth) {
                    <span class="absolute top-0 left-0 p-2 font-mono">
                      {{ img.naturalWidth }}x{{ img.naturalHeight }}
                    </span>
                  }
                </picture>
              }
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
  protected source = computed(() => this.service.fileSource(this.file()))

  protected textContent = httpResource.text(() => {
    const source = this.source()
    if (source?.textPath) {
      return source.baseUrl + source.textPath
    }
    return undefined
  })

  protected modelContent = computed((): ModelItemInfo[] => {
    const path = this.source()?.modelPath
    if (!path) {
      return null
    }
    return [
      {
        itemId: null,
        label: null,
        name: null,
        url: path,
        itemClass: null,
        appearance: null,
        rootUrl: this.source().baseUrl,
      },
    ]
  })
  protected showModelButton = computed(() => {
    const stat = this.source()
    return !!stat && !!stat.modelPath && !!stat.textPath
  })
  protected showModel = linkedSignal(() => {
    const stat = this.source()
    return !!stat && !!stat.modelPath && !stat.textPath
  })
  protected previewType = computed(() => {
    if (this.showModelButton()) {
      if (this.showModel()) {
        return '3D'
      }
      return 'TXT'
    }
    if (this.source()?.imagePath) {
      return 'IMG'
    }
    if (this.source()?.textPath) {
      return 'TXT'
    }
    if (this.source()?.modelPath) {
      return '3D'
    }
    return null
  })
}
