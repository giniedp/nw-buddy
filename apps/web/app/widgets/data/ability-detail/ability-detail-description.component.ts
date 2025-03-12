import { Component, computed, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { AbilityDetailStore } from './ability-detail.store'

@Component({
  selector: 'nwb-ability-detail-description',
  template: `
    @if (store.description() | nwText | nwTextBreak; as description) {
      <div [nwHtml]="description" class="text-nw-description italic leading-tight"></div>
    }
  `,
  styles: [
    `
      :host::ng-deep img {
        max-width: 24px;
        vertical-align: bottom;
      }
    `,
  ],
  host: {
    class: 'block font-nimbus',
    '[class.hidden]': 'isEmpty()',
  },
  imports: [NwModule],
})
export class AbilityDetailDescriptionComponent {
  protected store = inject(AbilityDetailStore)
  protected isEmpty = computed(() => !this.store.description())
}
