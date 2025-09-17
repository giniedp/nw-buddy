import { Component, inject, input } from '@angular/core'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { InfiniteScrollDirective, PaginationModule } from '../../../ui/pagination'
import { ItemDetailModule } from '../../../widgets/data/item-detail'

@Component({
  selector: 'nwb-game-mode-detail-loot',
  template: `
    @for (item of scroll.data(); track $index; let index = $index) {
      <nwb-item-detail
        animate.enter="fade-enter"
        [style.--enter-delay.ms]="(index - scroll.offset()) * 20"
        [itemId]="item"
      >
        <!-- [cdkContextMenuTriggerFor]="tplExplainMenu"
        (cdkContextMenuOpened)="explainItemDrop(item, 'normal')" -->
        <nwb-item-detail-header
          [enableInfoLink]="true"
          [enableTracker]="true"
          [enableLink]="true"
          class="rounded-md overflow-clip"
        />
      </nwb-item-detail>
    }
    @if (scroll.canLoad()) {
      <span nwbInfiniteScrollTrigger></span>
    }
  `,
  imports: [PaginationModule, ItemDetailModule],
  hostDirectives: [
    {
      directive: InfiniteScrollDirective,
      inputs: ['nwbInfniteScroll: items'],
    },
  ],
  host: {
    class: 'grid gap-4',
  },
  styles: `
    :host {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
  `,
})
export class GameModeDetailLootComponent {
  protected scroll = inject(InfiniteScrollDirective)
  public items = input<Array<MasterItemDefinitions | HouseItems>>([])
}
