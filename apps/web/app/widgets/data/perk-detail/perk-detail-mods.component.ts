import { Component, inject } from '@angular/core'
import { explainPerkMods } from '@nw-data/common'
import { ItemFrameModule } from '~/ui/item-frame'
import { selectSignal } from '~/utils'
import { PerkDetailStore } from './perk-detail.store'

@Component({
  selector: 'nwb-perk-detail-mods',
  template: `
    @for (item of mods(); track $index) {
      <nwb-item-perk [icon]="item.icon" [explanation]="item" class="text-sky-600" />
    }
  `,
  host: {
    class: 'block',
    '[class.hidden]': 'isEmpty()',
  },
  imports: [ItemFrameModule],
})
export class PerkDetailModsComponent {
  protected store = inject(PerkDetailStore)
  protected mods = selectSignal(
    {
      perk: this.store.perk,
      affixes: this.store.affixes,
      context: this.store.textContext,
    },
    ({ perk, affixes, context }) => {
      return explainPerkMods({ perk, affixes, gearScore: context.gearScore })
    },
  )
  protected isEmpty = selectSignal(this.mods, (mods) => !mods?.length)
}
