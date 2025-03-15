import { Component, computed, effect, inject, input } from '@angular/core'
import { LayoutModule } from '~/ui/layout'

import { FileTreeComponent, TreeNode } from '~/ui/file-tree'
import { AssetsStore } from './assets.store'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { toSignal } from '@angular/core/rxjs-interop'
import { debounceTime } from 'rxjs'
import { ActivatedRoute, Router } from '@angular/router'

@Component({
  standalone: true,
  selector: 'nwb-assets-sidebar',
  host: {
    class: 'ion-page',
  },
  imports: [LayoutModule, FileTreeComponent, QuicksearchModule],
  providers: [QuicksearchService],
  template: `
    <ion-header>
      <ion-toolbar>
        <nwb-quicksearch-input />
      </ion-toolbar>
    </ion-header>
    <ul
      class="menu menu-compact menu-xs flex-nowrap overflow-auto font-mono h-full"
      [nwbFileTree]="tree()"
      (selected)="handleFileSelection($event)"
    ></ul>
  `,
})
export class AssetsSidebarComponent {
  private search = inject(QuicksearchService)
  private query = toSignal(this.search.query$.pipe(debounceTime(1000)))
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  protected store = inject(AssetsStore)
  protected tree = computed(() => {
    return toTree(this.store.files() || [])
  })

  public constructor() {
    this.store.load(this.query)
  }

  protected handleFileSelection(file: any) {
    this.router.navigate(['.'], {
      queryParams: { file: file },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    })
  }
}

function toTree(files: string[]): TreeNode<string> {
  files.sort()
  const root: TreeNode<string> = {
    name: '',
    folders: [],
    files: [],
  }
  for (const file of files) {
    const tokens = file.split('/')
    const fileName = tokens.pop()
    let folder = root
    for (const dir of tokens) {
      let child = folder.folders.find((f) => f.name === dir)
      if (!child) {
        child = {
          name: dir,
          folders: [],
          files: [],
        }
        folder.folders.push(child)
      }
      folder = child
    }
    folder.files.push({
      data: file,
      name: fileName,
      id: file,
    })
  }
  return root
}
