import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { AbilityDetailDescriptionComponent } from './ability-detail-description.component'
import { AbilityDetailHeaderComponent } from './ability-detail-header.component'
import { AbilityDetailPropertiesComponent } from './ability-detail-properties.component'
import { AbilityDetailStore } from './ability-detail.store'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'

@Component({
  standalone: true,
  selector: 'nwb-ability-detail',
  template: `
    <nwb-ability-detail-header />
    <ng-content>
      <div class="p-4">
        <nwb-ability-detail-description class="nw-item-section" />
        @if (!disableProperties) {
          <nwb-ability-detail-properties class="nw-item-section" />
        }
      </div>
    </ng-content>
  `,
  exportAs: 'abilityDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemFrameModule,

    AbilityDetailHeaderComponent,
    AbilityDetailDescriptionComponent,
    AbilityDetailPropertiesComponent,
  ],
  providers: [CommonModule, DecimalPipe, AbilityDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class AbilityDetailComponent {
  protected decimals = inject(DecimalPipe)
  protected iconInfo = svgInfoCircle
  public readonly store = inject(AbilityDetailStore)

  @Input()
  public set abilityId(value: string) {
    this.store.load({ abilityId: value })
  }

  @Input()
  public disableProperties: boolean

  public abilityChange = outputFromObservable(toObservable(this.store.ability) )
}
