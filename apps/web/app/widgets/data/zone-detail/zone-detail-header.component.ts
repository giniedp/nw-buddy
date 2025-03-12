import { Component, computed, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { ZoneDetailStore } from './zone-detail.store'

@Component({
  selector: 'nwb-zone-detail-header',
  template: `
    <nwb-item-header class="gap-2 flex-none">
      <a [nwbItemIcon]="store.icon()" [nwLinkTooltip]="['poi', store.recordId()]" class="w-[76px] h-[76px]"> </a>
      <nwb-item-header-content
        class="z-10"
        [title]="store.name() | nwText | nwTextBreak: ' - '"
        [text1]="store.type()"
        [text2]="subtitle()"
      />
    </nwb-item-header>
  `,
  imports: [NwModule, ItemFrameModule, IconsModule],
  host: {
    class: 'block',
  },
})
export class ZoneDetailHeaderComponent {
  protected store = inject(ZoneDetailStore)
  protected subtitle = computed(() => {
    const territory = this.store.record()
    if (territory?.IsArea) {
      return `AI Level: ${territory.AIVariantLevelOverride}`
    }
    if (territory) {
      return [territory.RecommendedLevel, territory.MaximumLevel]
        .filter((it) => !!it)
        .map((it) => (it > 65 ? `${65}+` : it))
        .join(' - ')
    }
    return ''
  })
}
