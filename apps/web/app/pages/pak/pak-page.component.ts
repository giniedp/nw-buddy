import { Component, computed, effect, inject, signal, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CodeEditorComponent, CodeEditorModule } from '~/ui/code-editor'
import { LayoutModule } from '~/ui/layout'

import { httpResource } from '@angular/common/http'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { SplitGutterComponent, SplitPaneDirective } from '~/ui/split-container'
import { GameViewerModule } from '~/widgets/game-viewer'
import { ModelItemInfo, ModelViewerModule } from '~/widgets/model-viewer'
import { ObjectTreeComponent, ObjectTreeLabelDirective } from '../../ui/file-tree'
import { IconsModule } from '../../ui/icons'
import { svgCode, svgCubes, svgImage } from '../../ui/icons/svg'
import { MonacoSliceExtensionDirective } from './monaco'
import { dynamicSliceOutliner, Entity, entityComponentNames } from './outline'
import { PakSidebarComponent } from './pak-sidebar.component'
import { PakService } from './pak.service'
import { NwModule } from '../../nw'

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
    MonacoSliceExtensionDirective,
    ObjectTreeComponent,
    ObjectTreeLabelDirective,
    NwModule
  ],
  host: {
    class: 'ion-page flex flex-row',
  },
  templateUrl: './pak-page.component.html',
})
export class PakPageComponent {
  private service = inject(PakService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private file = toSignal(this.route.queryParams.pipe(map((params) => params['file'] as string)))
  private tabId = toSignal(this.route.queryParams.pipe(map((params) => params['tab'] as TabId)))
  protected source = computed(() => this.service.fileSource(this.file()))
  protected editor = viewChild(CodeEditorComponent)
  protected selectedEntity = signal<Entity>(null)
  protected entityComponents = computed(() => entityComponentNames(this.selectedEntity()))

  protected textContent = httpResource.text(() => {
    const source = this.source()
    if (source?.textPath) {
      return source.baseUrl + source.textPath
    }
    return undefined
  })

  protected outlineContent = computed(() => {
    const source = this.source()
    if (!source) {
      return null
    }
    if (source.ext !== 'dynamicslice') {
      return null
    }
    const text = this.textContent.value()
    return (
      dynamicSliceOutliner(text) || {
        items: [],
        adapter: null,
      }
    )
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
    const tabs: Array<{ id: TabId; label: string; icon: string; active?: boolean }> = []
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
    if (tabs.every((it) => !it.active) && tabs.length > 0) {
      tabs[0].active = true
    }
    return tabs
  })

  protected previewType = computed(() => {
    return this.tabs()?.find((it) => it.active)?.id
  })

  protected handleFileSelection(file: string, newTab: boolean) {
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

  protected handleEntitySelection(item: Entity) {
    this.selectedEntity.set(item)
    this.scrollToEntity(item)
  }

  protected handleComponentSelection(name: string) {
    this.scrollToComponent(this.selectedEntity(), name)
  }

  private scrollToEntity(item: Entity) {
    const id = item?.id?.id
    const editor = this.editor()?.editor()
    if (!editor || !id) {
      return
    }
    const model = editor.getModel()
    const matches = model.findMatches(`"id":\\s*${id}`, false, true, false, null, false)
    if (matches.length > 0) {
      const match = matches[0]
      editor.setPosition({ column: match.range.startColumn, lineNumber: match.range.startLineNumber })
      editor.revealLineNearTop(match.range.startLineNumber)
      return
    }
  }

  private scrollToComponent(item: Entity, component: string) {
    const id = item?.id?.id
    const editor = this.editor()?.editor()
    if (!editor || !id) {
      return
    }
    const model = editor.getModel()
    const range1 = model.findMatches(`"id":\\s*${id}`, false, true, false, null, false)?.[0]?.range
    if (!range1) {
      return
    }
    const matches = model.findMatches(`"__type":\\s*"${component}"`, false, true, false, null, false)
    if (!matches.length) {
      return
    }
    for (const match of matches) {
      if (match.range.startLineNumber > range1.startLineNumber) {
        editor.setPosition({ column: match.range.startColumn, lineNumber: match.range.startLineNumber })
        editor.revealLineNearTop(match.range.startLineNumber)
        return
      }
    }
  }

  protected isEntityRuntimeActive(entity: Entity) {
    return !!entity?.['isruntimeactive']
  }

  protected isEntityInTheWorld(entity: Entity) {
    for (const component of entityComponentNames(entity)) {
      if (component === 'PositionInTheWorldComponent') {
        return true
      }
    }
    return false
  }
}
