import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
    <cdk-virtual-scroll-viewport itemSize="24" class="h-full">
      <div
        *cdkVirtualFor="let item of store.flatlist(); trackBy: trackBy"
        [style.paddingLeft.px]="item.depth * 10"
        class="whitespace-nowrap overflow-hidden h-6"
        [class.text-primary]="item.id === active()"
      >
        <nwb-icon [icon]="item.isDir ? folderIcon : fileIcon" class="w-4 h-4" />
        <a (click)="handleClick(item)" (keydown.space)="handleClick(item); (false)" class="cursor-pointer" tabindex="0">
          {{ item.name }}
        </a>
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
    if (!this.search()) {
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
        this.viewport().checkViewportSize()
        const index = this.store.select(this.selection())
        if (index >= 0) {
          this.viewport().scrollToIndex(index)
        }
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
