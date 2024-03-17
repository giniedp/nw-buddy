import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { PaginationModule } from '~/ui/pagination'
import { GridSelectFilterStore } from './grid-select-filter.store'
import { GridSelectFilterOption } from './types'
import { ScrollingModule } from '@angular/cdk/scrolling'

@Component({
  standalone: true,
  selector: 'nwb-grid-select-options',
  template: `
    <cdk-virtual-scroll-viewport
    [itemSize]="32"
    class="h-full overflow-hidden"
    >
      <ng-container *cdkVirtualFor="let item of options; trackBy: virtualTrackBy">
        <button
          class="flex flex-row flex-nowrap w-full rounded-none truncate text-nowrap btn btn-sm justify-start no-animation shadow-black"
          [class.btn-ghost]="!isSelected(item)"
          [class.btn-primary]="isSelected(item)"
          [class.text-shadow-sm]="!!item.class"
          (click)="onOptionClicked(item)"
          [ngClass]="item.class"
          >
          @if (item.icon) {
            <img class="w-6 h-6" [src]="item.icon" />
          }
          {{ item.label }}
        </button>
      </ng-container>
    </cdk-virtual-scroll-viewport>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, PaginationModule, ScrollingModule],
  host: {
    class: 'flex flex-col',
    '[style.height]': '"calc(min(800px, 30vh))"',
  },
})
export class GridSelectOptionsComponent {
  private store = inject(GridSelectFilterStore)

  protected get options() {
    return this.store.displayOptions()
  }

  protected isSelected(item: GridSelectFilterOption) {
    return !!this.store.getFilterForOption(item)
  }

  protected onOptionClicked(item: GridSelectFilterOption) {
    this.store.toggleSelection(item)
  }

  protected virtualTrackBy = (i: number) => i
}
