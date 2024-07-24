import { Component, computed, inject } from '@angular/core'
import { PerkDetailStore } from './perk-detail.store'
import { NwModule } from '~/nw'
import { selectSignal } from '~/utils'
import { NwTextContextService } from '~/nw/expression'
import { getPerkItemClassGSBonus } from '@nw-data/common'

@Component({
  standalone: true,
  selector: 'nwb-perk-detail-description',
  template: `
    @if (description(); as text) {
      <div [nwHtml]="text | nwText: textContext() | nwTextBreak" class="text-nw-description italic"></div>

      @if (classGsBonus(); as bonus) {
        <div>
          On {{ bonus.itemClass }}:
          <div
            [nwHtml]="text | nwText: textContextClass() | nwTextBreak"
            class="text-nw-description italic"
          ></div>
        </div>
      }
    }
  `,
  imports: [NwModule],
  host: {
    class: 'block',
    '[class.hidden]': 'isEmpty()',
  },
})
export class PerkDetailDescriptionComponent {
  protected store = inject(PerkDetailStore)
  protected description = this.store.description
  protected classGsBonus = this.store.itemClassGsBonus
  protected isEmpty = computed(() => !this.description())

  protected context = inject(NwTextContextService)
  protected textContext = this.store.textContext
  protected textContextClass = this.store.textContextClass

}
