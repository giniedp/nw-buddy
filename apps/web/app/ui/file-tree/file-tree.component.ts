import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
  runInInjectionContext,
  untracked,
  viewChild,
} from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgFileCode, svgFolderOpen } from '~/ui/icons/svg'

import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling'
import { FileTreeNode, FileTreeStore } from './file-tree.store'

@Component({
  standalone: true,
  selector: 'nwb-file-tree',
  imports: [IconsModule, ScrollingModule],
  providers: [FileTreeStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full',
  },
  template: `
    <cdk-virtual-scroll-viewport itemSize="24" class="h-full" (scrolledIndexChange)="viewport().checkViewportSize()">
      <div
        *cdkVirtualFor="let item of store.flatlist(); trackBy: trackBy"
        [style.paddingLeft.px]="item.depth * 10"
        class="whitespace-nowrap overflow-hidden h-6 cursor-pointer group"
        [class.text-primary]="item.id === active()"
        (click)="handleClick(item)"
        (keydown.space)="handleClick(item); (false)"
        tabindex="0"
      >
        <nwb-icon [icon]="item.isDir ? folderIcon : fileIcon" class="w-4 h-4" />
        <span class="opacity-80 group-hover:opacity-100">
          {{ item.name }}
        </span>
      </div>
    </cdk-virtual-scroll-viewport>
  `,
})
export class FileTreeComponent {
  protected store = inject(FileTreeStore)
  public files = input<string[]>()
  public search = input<string>('')
  public selected = output<string>()
  public selection = input<string>()
  protected active = linkedSignal(() => this.selection())
  protected displayFiles = computed(() => {
    if (!this.search() || !this.files()) {
      return this.files()
    }
    return this.files().filter((f) => f.includes(this.search()))
  })

  protected folderIcon = svgFolderOpen
  protected fileIcon = svgFileCode
  protected trackBy = (i: number, item: FileTreeNode) => item.id
  protected viewport = viewChild(CdkVirtualScrollViewport)

  public constructor() {
    effect(() => {
      const files = this.displayFiles()
      untracked(() => {
        this.store.load(files)
        const index = this.store.select(this.selection())
        if (index >= 0) {
          this.viewport().scrollToIndex(index)
        }
        setTimeout(() => {
          this.viewport().checkViewportSize()
        })

      })
    })
  }

  protected handleClick(item: FileTreeNode) {
    if (item.isDir) {
      this.store.toggle(item.id)
    } else {
      this.active.set(item.id)
      this.selected.emit(item.id)
    }
  }
}
