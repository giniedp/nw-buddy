import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  untracked,
  viewChild,
} from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgFileCode, svgFolder, svgFolderOpen } from '~/ui/icons/svg'

import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling'

import { ObjectTreeAdapter, ObjectTreeNode, ObjectTreeStore } from './object-tree.store'
import { ObjectTreeLabelDirective } from './object-tree-label.directive'
import { NgTemplateOutlet } from '@angular/common'

@Component({
  standalone: true,
  selector: 'nwb-object-tree',
  imports: [IconsModule, ScrollingModule, NgTemplateOutlet],
  providers: [ObjectTreeStore],
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
        <div class="join w-full">
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
              @if (tplLabel()) {
                <ng-container
                  [ngTemplateOutlet]="tplLabel().template"
                  [ngTemplateOutletContext]="{ $implicit: item.object }"
                />
              } @else {
                {{ item.name }}
              }
            </span>
          </button>
        </div>
      </div>
    </cdk-virtual-scroll-viewport>
  `,
})
export class ObjectTreeComponent<T> {
  protected store = inject(ObjectTreeStore)
  public items = input<T[]>()
  public adapter = input<ObjectTreeAdapter<T>>()
  public search = input<string>('')
  public open = input<boolean>(false)
  public selected = output<T>()
  public selection = input<string>()
  protected active = linkedSignal(() => this.selection())
  protected tplLabel = contentChild(ObjectTreeLabelDirective)

  protected folderOpenIcon = svgFolderOpen
  protected folderIcon = svgFolder
  protected fileIcon = svgFileCode
  protected trackBy = (i: number, item: ObjectTreeNode) => item.id
  protected viewport = viewChild(CdkVirtualScrollViewport)

  public constructor() {
    effect(() => {
      const items = this.items()
      const adapter = this.adapter()
      untracked(() => this.store.load(items, adapter))
    })

    effect(() => {
      this.store.tree() // trigger update
      const open = this.open()
      untracked(() => {
        if (open) {
          this.store.expandAll()
        }
      })
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
      this.store.list()
      this.store.selection()
      untracked(() => this.scrollToSelection())
    })
  }

  protected handleToggle(item: ObjectTreeNode) {
    if (item.isDir) {
      this.store.toggle(item.id)
    } else {
      this.active.set(item.id)
      this.selected.emit(item.object)
    }
  }

  protected handleClick(item: ObjectTreeNode) {
    this.active.set(item.id)
    this.selected.emit(item.object)
  }

  private scrollToSelection() {
    setTimeout(() => {
      this.viewport().checkViewportSize()
      setTimeout(() => {
        const index = this.store.selection()
        const range = this.viewport().getRenderedRange()
        if (index >= 0 && (index < range.start || index > range.end)) {
          const mid = Math.max(0, index - (range.end - range.start) / 2)
          this.viewport().scrollToIndex(mid)
        }
      })
    })
  }
}
