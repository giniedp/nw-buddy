import { Component, computed, inject, input } from '@angular/core'
import { LayoutModule } from '~/ui/layout'
import { DatasheetsTreeComponent } from './datasheets-tree.component'
import { Datasheet, TreeNode } from './types'
import { DatasheetsStore } from './datasheets.store'

@Component({
  standalone: true,
  selector: 'nwb-datasheets-sidebar',
  host: {
    class: 'ion-page',
  },
  imports: [LayoutModule, DatasheetsTreeComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Datasheets</ion-title>
      </ion-toolbar>
    </ion-header>
    <ul class="menu menu-compact menu-xs flex-nowrap overflow-auto font-mono" [nwbFileTree]="root()"></ul>
  `,
})
export class DatasheetsSidebarComponent {
  protected store = inject(DatasheetsStore)
  public files = input<Datasheet[], Datasheet[]>(null, {
    transform: (files) => {
      return [...(files || [])].sort((a, b) => a.id.localeCompare(b.id))
    },
  })
  protected root = computed(() => toTree(this.files()))
}

function toTree(files: Datasheet[]): TreeNode {
  const root = {
    name: '',
    folders: [],
    files: [],
  }
  for (const file of files) {
    const tokens = file.id.split('/')
    tokens.pop() // remove the file name
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
    folder.files.push(file)
  }
  return root
}
