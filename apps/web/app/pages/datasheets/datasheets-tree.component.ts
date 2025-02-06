import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgFileCode, svgFolderOpen } from '~/ui/icons/svg'
import { Datasheet, TreeNode } from './types'
import { DatasheetsStore } from './datasheets.store'
import { RouterLink } from '@angular/router'

@Component({
  standalone: true,
  selector: 'details[nwbFileTree],ul[nwbFileTree]',
  imports: [IconsModule, RouterLink],
  template: `
    @if (node().name; as name) {
      <summary>
        <nwb-icon [icon]="folderIcon" class="w-4 h-4" />
        {{ name }}
      </summary>
    }
    <ul>
      @if (isOpen()) {
        @for (folder of node().folders; track folder.name) {
          <li>
            <details [nwbFileTree]="folder" class="w-full overflow-hidden"></details>
          </li>
        }
        @for (file of node().files; track file.id) {
          <li  class="w-full overflow-hidden">
            <a [routerLink]="['./']" [queryParams]="{ file: file.id }">
              <nwb-icon [icon]="fileIcon" class="w-4 h-4" />
              {{ file.filename }}
            </a>
          </li>
        }
      }
    </ul>
  `,
})
export class DatasheetsTreeComponent {
  private store = inject(DatasheetsStore)
  public node = input<TreeNode>(null, { alias: 'nwbFileTree' })
  protected el = inject<ElementRef<HTMLDetailsElement>>(ElementRef).nativeElement
  protected isOpen = signal(this.el.tagName !== 'DETAILS')
  protected folderIcon = svgFolderOpen
  protected fileIcon = svgFileCode

  @HostListener('toggle', ['$event'])
  protected onToggle(e: ToggleEvent) {
    if (e.target === this.el) {
      this.isOpen.set(this.el.open)
    }
  }

  protected handleFileSelection(file: Datasheet) {
    this.store.select(file.id)
  }
}
