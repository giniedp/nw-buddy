import { Component, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { GatherableDetailStore } from './gatherable-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-gatherable-detail-header',
  template: `
    <nwb-item-header class="gap-2">
      <a [nwbItemIcon]="icon" [nwLink]="recordId" [nwLinkResource]="'gatherable'" class="w-[76px] h-[76px]"> </a>
      <nwb-item-header-content
        class="z-10"
        [title]="name | nwText | nwTextBreak: ' - '"
        [text1]="'Gatherable'"
        [text2]="size"
        [text3]="tradeSkill"
      />
    </nwb-item-header>
  `,
  imports: [ItemFrameModule, IconsModule, NwModule],
})
export class GatherableDetailHeaderComponent {
  protected store = inject(GatherableDetailStore)

  public get recordId() {
    return this.store.gatherableId()
  }

  public get icon() {
    return this.store.icon()
  }
  public get name() {
    return this.store.name()
  }
  public get size() {
    return this.store.size()
  }
  public get tradeSkill() {
    return this.store.tradeSkill()
  }
}
