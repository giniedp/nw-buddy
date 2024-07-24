import { Component, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { AbilityDetailStore } from './ability-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-ability-detail-header',
  template: `
    <nwb-item-header class="gap-2">
      <a [nwbItemIcon]="store.icon()" [nwLinkTooltip]="['ability', store.abilityId()]" class="w-[76px] h-[76px]"> </a>
      <nwb-item-header-content
        class="z-10"
        [title]="store.nameForDisplay() | nwText | nwTextBreak: ' - '"
        [text1]="'Ability'"
        [text2]="store.weapon() || store.source()"
      />
    </nwb-item-header>
  `,
  host: {
    class: 'block',
  },
  imports: [NwModule, ItemFrameModule],
})
export class AbilityDetailHeaderComponent {
  protected store = inject(AbilityDetailStore)
}
