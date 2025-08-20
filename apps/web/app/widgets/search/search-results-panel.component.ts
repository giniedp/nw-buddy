import { ScrollingModule } from '@angular/cdk/scrolling'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { environment } from 'apps/web/environments'
import { NwLinkService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import type { SearchRecord } from './search-query.worker'

@Component({
  selector: 'nwb-search-results-panel',
  templateUrl: './search-results-panel.component.html',
  styleUrls: ['./search-results-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ScrollingModule, ItemFrameModule, RouterModule],
  host: {
    class: 'layout-content overflow-clip',
  },
})
export class SearchResultsPanelComponent {
  protected link = inject(NwLinkService)

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

  protected getIcon(item: SearchRecord) {
    if (!item.icon) {
      return NW_FALLBACK_ICON
    }
    return environment.nwImagesUrl + '/' + item.icon.replace(/\.png$/, '.webp').toLowerCase()
  }

  protected getRoute(item: SearchRecord) {
    if (item.type === 'item') {
      return this.link.resourceLink({ type: 'item', id: item.id })
    }
    if (item.type === 'housing') {
      return this.link.resourceLink({ type: 'housing', id: item.id })
    }
    if (item.type === 'crafting') {
      return this.link.resourceLink({ type: 'recipe', id: item.id })
    }
    if (item.type === 'perk') {
      return this.link.resourceLink({ type: 'perk', id: item.id })
    }
    if (item.type === 'ability') {
      return this.link.resourceLink({ type: 'ability', id: item.id })
    }
    if (item.type === 'statuseffect') {
      return this.link.resourceLink({ type: 'status-effect', id: item.id })
    }
    if (item.type === 'zone') {
      return this.link.resourceLink({ type: 'poi', id: item.id })
    }
    if (item.type === 'quest') {
      return this.link.resourceLink({ type: 'quest', id: item.id })
    }
    if (item.type === 'vital') {
      return this.link.resourceLink({ type: 'vitals', id: item.id })
    }
    if (item.type === 'appearance' || item.type === 'transmog') {
      return this.link.resourceLink({ type: 'transmog', id: item.id })
    }
    if (item.type === 'mount') {
      return this.link.resourceLink({ type: 'mount', id: item.id })
    }
    if (item.type === 'poi') {
      return this.link.resourceLink({ type: 'poi', id: item.id })
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
