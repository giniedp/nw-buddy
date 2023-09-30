import { ScrollingModule } from '@angular/cdk/scrolling'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import type { SearchRecord } from './search-query.worker'
import { animate, style, transition, trigger } from '@angular/animations'

@Component({
  standalone: true,
  selector: 'nwb-search-results-panel',
  templateUrl: './search-results-panel.component.html',
  styleUrls: ['./search-results-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ScrollingModule, ItemFrameModule, RouterModule],
  host: {
    class: 'layout-content overflow-clip',
  },
  animations: [
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('0.150s ease-out', style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: 1 }), animate('0.150s ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class SearchResultsPanelComponent {
  @Input()
  public isLoading: boolean = false

  @Input()
  public data: Array<SearchRecord>

  @Output()
  public recordSelected = new EventEmitter<SearchRecord>()

  protected defaultIcon = NW_FALLBACK_ICON
  public constructor() {
    //
  }

  protected getRoute(item: SearchRecord) {
    if (item.type === 'item') {
      return ['/items/table', item.id]
    }
    if (item.type === 'housing') {
      return ['/housing/table', item.id]
    }
    if (item.type === 'crafting') {
      return ['/crafting/table', item.id]
    }
    if (item.type === 'perk') {
      return ['/perks/table', item.id]
    }
    if (item.type === 'ability') {
      return ['/abilities/table', item.id]
    }
    if (item.type === 'statuseffect') {
      return ['/status-effects/table', item.id]
    }
    if (item.type === 'poi') {
      return ['/poi/table', item.id]
    }
    if (item.type === 'quest') {
      return ['/quests/table', item.id]
    }
    if (item.type === 'vital') {
      return ['/vitals/table', item.id]
    }
    if (item.type === 'appearance' || item.type === 'transmog') {
      return ['/transmog/table', item.id]
    }
    if (item.type === 'mount') {
      return ['/mounts/table', item.id]
    }
    console.warn('Unknown item type', item)
    return null
  }

  protected tags(item: any) {
    const tags = []
    if (item.tier) {
      tags.push(`T${item.tier}`)
    }
    if (item.gs) {
      tags.push(`GS${item.gs}`)
    }
    return tags.length ? tags.join(', ') : null
  }
}
