import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  untracked,
  viewChild,
} from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgFileCode, svgFolderOpen } from '~/ui/icons/svg'

import { CdkMenuModule } from '@angular/cdk/menu'
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling'
import { FileTreeNode, FileTreeStore } from './file-tree.store'

@Component({
  standalone: true,
  selector: 'nwb-file-tree',
  imports: [IconsModule, ScrollingModule, CdkMenuModule],
  providers: [FileTreeStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full',
  },
  template: `
    <cdk-virtual-scroll-viewport [itemSize]="32" class="h-full" (scrolledIndexChange)="viewport().checkViewportSize()">
      <div
        *cdkVirtualFor="let item of store.list(); trackBy: trackBy"
        [style.paddingLeft.px]="item.depth * 12"
        class="whitespace-nowrap overflow-hidden h-8 cursor-pointer group"
      >
        <div class="join w-full" [cdkContextMenuTriggerFor]="tplContextMenu">
          @if (item.isDir) {
            <button class="join-item btn btn-sm btn-square btn-ghost" (click)="handleToggle(item)">
              <nwb-icon [icon]="item.isDir ? folderIcon : fileIcon" class="w-5 h-5" />
            </button>
          }
          <button
            class="join-item btn btn-sm bt-ghost w-full justify-start no-animation flex-nowrap pl-1"
            [class.text-primary]="item.id === active()"
            (click)="handleClick(item)"
            (dblclick)="handleToggle(item)"
            (keydown.space)="handleClick(item); (false)"
            tabindex="0"
          >
            @if (!item.isDir) {
              <nwb-icon [icon]="fileIcon" class="w-5 h-5" />
            }
            <span
              class="block opacity-80 group-hover:opacity-100 whitespace-nowrap text-nowrap overflow-hidden text-ellipsis"
            >
              {{ item.name }}
            </span>
          </button>
        </div>
        <ng-template #tplContextMenu>
          <ul class="my-1 menu menu-compact bg-base-200 border border-base-100 rounded-md shadow-lg" cdkMenu>
            <li class="text-shadow-sm shadow-black" cdkMenuItem (click)="handleCopyName(item)">
              <span>Copy Name</span>
            </li>
            <li class="text-shadow-sm shadow-black" cdkMenuItem (click)="handleCopyPath(item)">
              <span>Copy Path</span>
            </li>
          </ul>
        </ng-template>
      </div>
    </cdk-virtual-scroll-viewport>
  `,
})
export class FileTreeComponent {
  protected store = inject(FileTreeStore)
  public files = input<string[]>()
  public search = input<string>('')
  public selected = output<FileTreeNode>()
  public selection = input<string>()
  protected active = linkedSignal(() => this.selection())

  protected folderIcon = svgFolderOpen
  protected fileIcon = svgFileCode
  protected trackBy = (i: number, item: FileTreeNode) => item.id
  protected viewport = viewChild(CdkVirtualScrollViewport)

  public constructor() {
    effect(() => {
      const files = this.files()
      untracked(() => this.store.load(files))
    })

    effect(() => {
      const search = this.search()
      untracked(() => this.store.filter(search))
    })

    effect(() => {
      const selection = this.selection()
      untracked(() => this.store.select(selection))
    })

    effect(() => {
      this.store.search()
      this.store.selection()
      untracked(() => this.scrollToSelection())
    })
  }

  protected handleClick(item: FileTreeNode) {
    this.active.set(item.id)
    this.selected.emit(item)
  }

  protected handleToggle(item: FileTreeNode) {
    if (item.isDir) {
      this.store.toggle(item.id)
    }
  }

  private scrollToSelection() {
    setTimeout(() => {
      this.viewport().checkViewportSize()
      setTimeout(() => {
        const index = this.store.selectedIndex()
        const range = this.viewport().getRenderedRange()
        if (index >= 0 && (index < range.start || index > range.end)) {
          const mid = Math.max(0, index - (range.end - range.start) / 2)
          this.viewport().scrollToIndex(mid)
        }
      })
    })
  }

  protected handleCopyName(item: FileTreeNode) {
    navigator.clipboard.writeText(item.name)
  }

  protected handleCopyPath(item: FileTreeNode) {
    navigator.clipboard.writeText(item.id)
  }
}
