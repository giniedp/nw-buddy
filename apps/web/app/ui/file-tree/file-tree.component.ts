import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgFileCode, svgFolderOpen } from '~/ui/icons/svg'

import { TreeNode } from './types'

@Component({
  standalone: true,
  selector: 'details[nwbFileTree],ul[nwbFileTree]',
  imports: [IconsModule],

  template: `
    @if (node().name; as name) {
      <summary>
        <nwb-icon [icon]="folderIcon" class="w-4 h-4" />
        {{ name }}
      </summary>
    }
    @if (isOpen()) {
      <ul>
        @for (folder of node().folders; track folder.name) {
          <li>
            <details [nwbFileTree]="folder" class="w-full overflow-hidden" (selected)="selected.emit($event)"></details>
          </li>
        }
        @for (file of node().files; track file.name) {
          <li class="w-full overflow-hidden">
            <a (click)="selected.emit(file.data)">
              <nwb-icon [icon]="fileIcon" class="w-4 h-4" />
              {{ file.name }}
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class FileTreeComponent<T> {
  public node = input<TreeNode<T>>(null, { alias: 'nwbFileTree' })
  public search = input<string>('')
  protected el = inject<ElementRef<HTMLDetailsElement>>(ElementRef).nativeElement
  protected isOpen = signal(this.el.tagName !== 'DETAILS')
  protected folderIcon = svgFolderOpen
  protected fileIcon = svgFileCode

  public selected = output<T>()

  @HostListener('toggle', ['$event'])
  protected onToggle(e: ToggleEvent) {
    if (e.target === this.el) {
      this.isOpen.set(this.el.open)
    }
  }
}
