import { Component, computed, inject, linkedSignal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CodeEditorModule } from '~/ui/code-editor'
import { LayoutModule } from '~/ui/layout'

import { httpResource } from '@angular/common/http'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { ModelItemInfo, ModelViewerModule } from '~/widgets/model-viewer'
import { PakSidebarComponent } from './pak-sidebar.component'
import { PakService } from './pak.service'
import { SplitGutterComponent, SplitPaneDirective } from '~/ui/split-container'
import { GameViewerModule } from '~/widgets/game-viewer'
import { svgCode, svgCubes, svgImage } from '../../ui/icons/svg'
import { IconsModule } from '../../ui/icons'
import { MonacoSliceExtensionDirective } from './monaco'

export type TabId = 'img' | 'txt' | '3d'
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
    GameViewerModule,
    RouterModule,
    IconsModule,
    MonacoSliceExtensionDirective
  ],
  host: {
    class: 'ion-page flex flex-row',
  },
  templateUrl: './pak-page.component.html'
})
export class PakPageComponent {
  private service = inject(PakService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private file = toSignal(this.route.queryParams.pipe(map((params) => params['file'] as string)))
  private tabId = toSignal(this.route.queryParams.pipe(map((params) => params['tab'] as TabId)))
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

  protected tabs = computed(() => {
    const tabId = this.tabId()
    const tabs: Array<{ id: TabId, label: string, icon: string, active?: boolean}> = []
    const source = this.source()
    if (!source) {
      return tabs
    }
    if (source.imagePath) {
      tabs.push({ id: 'img', label: 'Image', icon: svgImage })
    }
    if (source.textPath) {
      tabs.push({ id: 'txt', label: source.textType || 'Text', icon: svgCode })
    }
    if (source.modelPath) {
      tabs.push({ id: '3d', label: '3D', icon: svgCubes })
    }
    for (const tab of tabs) {
      tab.active = tab.id == tabId
    }
    if (tabs.every((it) => !it.active) && tabs.length > 0)  {
      tabs[0].active = true
    }
    return tabs
  })

  protected previewType = computed(() => {
    return this.tabs()?.find((it) => it.active)?.id
  })

  protected handleFileSelection(file: string, newTab: boolean) {
    console.log('handleFileSelection', file, newTab)
    if (newTab) {
      const url = new URL(location.pathname, location.origin)
      url.searchParams.set('file', file)
      window.open(url.toString(), '_blank')
      return
    }
    this.router.navigate(['.'], {
      queryParams: { file },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    })
  }
}
