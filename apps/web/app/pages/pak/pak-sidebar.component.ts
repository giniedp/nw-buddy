import { Component, inject, signal } from '@angular/core'
import { LayoutModule } from '~/ui/layout'

import { httpResource } from '@angular/common/http'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { debounceTime, map } from 'rxjs'
import { FileTreeComponent } from '~/ui/file-tree'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { PakService } from './pak.service'
import { FileTreeNode } from '../../ui/file-tree/file-tree.store'

@Component({
  standalone: true,
  selector: 'nwb-assets-sidebar',
  host: {
    class: 'ion-page',
  },
  imports: [LayoutModule, FileTreeComponent, QuicksearchModule],
  providers: [
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
  template: `
    <ion-header class="bg-base-300">
      <ion-toolbar class="px-2">
        <nwb-quicksearch-input />
      </ion-toolbar>
    </ion-header>
    @if (files.isLoading()) {
      <div class="h-full flex items-center justify-center">
        <span class="loading loading-spinner"></span>
      </div>
    } @else {
      <nwb-file-tree
        class="h-full px-2"
        [files]="files.value()"
        [search]="search()"
        [selection]="selection()"
        (selected)="handleFileSelection($event)"
      />
    }
  `,
})
export class PakSidebarComponent {
  private service = inject(PakService)
  protected search = toSignal(inject(QuicksearchService).query$.pipe(debounceTime(300)))
  protected files = httpResource<string[]>(() => this.service.listUrl('**'))

  private router = inject(Router)
  private route = inject(ActivatedRoute)

  protected selection = toSignal(this.route.queryParams.pipe(map((it) => it['file'])))
  protected handleFileSelection(file: FileTreeNode) {
    if (file.isDir) {
      return
    }
    this.router.navigate(['.'], {
      queryParams: { file: file.id },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    })
  }
}
