import { Component, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { debounceTime } from 'rxjs'
import { FileTreeComponent } from '~/ui/file-tree'
import { LayoutModule } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ActionlistsStore } from './actionlists.store'
import { FileTreeNode } from '../../ui/file-tree'

@Component({
  selector: 'nwb-actionlists-sidebar',
  host: {
    class: 'ion-page',
  },
  imports: [LayoutModule, FileTreeComponent, QuicksearchModule],
  template: `
    <ion-header class="bg-base-300">
      <ion-toolbar>
        <nwb-quicksearch-input class="px-2"/>
      </ion-toolbar>
    </ion-header>
    <nwb-file-tree
      class="h-full font-mono"
      [files]="files()"
      [search]="search()"
      [selection]="selection()"
      (selected)="handleFileSelection($event)"
    />
  `,
})
export class ActionlistsSidebarComponent {
  protected store = inject(ActionlistsStore)
  protected search = toSignal(inject(QuicksearchService).query$.pipe(debounceTime(1000)))
  protected files = this.store.files

  private router = inject(Router)
  private route = inject(ActivatedRoute)

  protected selection = signal(this.route.snapshot.queryParams['file'])
  protected handleFileSelection(file: FileTreeNode) {
    if (file.isDir) {
      return
    }
    this.router.navigate(['.'], {
      queryParams: { file: file.id, selection: null },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    })
  }
}
