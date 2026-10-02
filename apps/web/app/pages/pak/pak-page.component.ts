import { Component, computed, inject, linkedSignal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { LayoutModule } from '~/ui/layout'
import { SplitGutterComponent, SplitPaneDirective } from '~/ui/split-container'
import { IconsModule } from '../../ui/icons'
import { PakDocsComponent } from './pak-docs.component'
import { PakNavbarComponent } from './pak-navbar.component'
import { PakPreviewCodeComponent } from './pak-preview-code.component'
import { PakPreviewImageComponent } from './pak-preview-image.component'
import { PakPreviewModelComponent } from './pak-preview-model.component'
import { PakPreviewSliceComponent } from './pak-preview-slice.component'
import { PakSidebarComponent } from './pak-sidebar.component'
import { FileResource, PakService } from './pak.service'

@Component({
  standalone: true,
  selector: 'nwb-assets-page',
  providers: [PakService],
  imports: [
    PakSidebarComponent,
    LayoutModule,
    RouterModule,
    SplitPaneDirective,
    SplitGutterComponent,
    PakDocsComponent,
    PakNavbarComponent,
    IconsModule,

    PakPreviewCodeComponent,
    PakPreviewImageComponent,
    PakPreviewModelComponent,
    PakPreviewSliceComponent,
  ],
  host: {
    class: 'ion-page flex flex-row',
  },
  templateUrl: './pak-page.component.html',
})
export class PakPageComponent {
  protected service = inject(PakService)
  protected route = inject(ActivatedRoute)
  protected file = toSignal(this.route.queryParams.pipe(map((params) => params['file'] as string)))
  protected sources = computed(() => this.service.fileSource(this.file()))
  protected source = linkedSignal({
    source: this.sources,
    computation: (source) => {
      if (!source[0]) {
        return null
      }

      const preference = getPreference(source[0].ext)
      return source.find((it) => it.id === preference) || source[0]
    },
  })
  protected sourceId = computed(() => this.source()?.id)
  protected viewerType = computed(() => this.source()?.viewer)

  protected breadcrumbs = computed(() => {
    const result: Crumb[] = []
    for (const token of (this.file() || '').split('/')) {
      result.push({
        label: token,
        id: result.map((it) => it.label).join('/') + `/${token}`,
      })
    }
    return result
  })

  protected selectSource(source: FileResource) {
    setPreference(source.ext, source.id)
    this.source.set(source)
  }
}

export interface Crumb {
  id: string
  label: string
}

function getPreference(ext: string) {
  return sessionStorage.getItem(`viewer-preference-${ext}`)
}

function setPreference(ext: string, value: string) {
  sessionStorage.setItem(`viewer-preference-${ext}`, value)
}
