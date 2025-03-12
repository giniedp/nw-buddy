import { Component, computed, inject, input } from '@angular/core'
import { NwModule } from '~/nw'
import { NwTextContextService } from '~/nw/expression'
import { PerkDetailStore } from './perk-detail.store'

@Component({
  selector: 'nwb-perk-detail-description',
  template: `
    @if (description(); as text) {
      @if (!preferBonus() || !classGsBonus()) {
        <div [nwHtml]="text | nwText: textContext() | nwTextBreak" class="text-nw-description italic"></div>
      }

      @if (classGsBonus(); as bonus) {
        <div>
          On {{ bonus.itemClass }}:
          <div [nwHtml]="text | nwText: textContextClass() | nwTextBreak" class="text-nw-description italic"></div>
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
  public preferBonus = input<boolean>(false)
  protected store = inject(PerkDetailStore)
  protected description = this.store.description
  protected classGsBonus = this.store.itemClassGsBonus
  protected isEmpty = computed(() => !this.description())

  protected context = inject(NwTextContextService)
  protected textContext = this.store.textContext
  protected textContextClass = this.store.textContextClass
}
