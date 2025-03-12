import { Component, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { GatherableDetailStore } from './gatherable-detail.store'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'nwb-gatherable-detail-header',
  template: `
    <nwb-item-header class="gap-2">
      <a [nwbItemIcon]="icon" [nwLinkTooltip]="['gatherable', recordId]" class="w-[76px] h-[76px]"> </a>
      <nwb-item-header-content
        class="z-10"
        [title]="name | nwText | nwTextBreak: ' - '"
        [text1]="'Gatherable'"
        [text2]="info"
        [titleLink]="['gatherable', recordId] | nwLink"
        [showSkeleton]="!store.isLoaded()"
      />
    </nwb-item-header>
  `,
  imports: [ItemFrameModule, IconsModule, NwModule, RouterModule],
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
  public get info() {
    const result: string[] = []
    if (this.store.size()) {
      result.push(this.store.size())
    }
    if (this.store.tradeSkill() && this.store.tradeSkill() !== 'None') {
      result.push(this.store.tradeSkill())
    }
    if (this.store.requiredSkillLevel()) {
      result.push(`level ${this.store.requiredSkillLevel()}`)
    }
    return result.join(', ')
  }
}
