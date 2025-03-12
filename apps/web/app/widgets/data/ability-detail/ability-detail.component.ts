import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { AbilityDetailDescriptionComponent } from './ability-detail-description.component'
import { AbilityDetailHeaderComponent } from './ability-detail-header.component'
import { AbilityDetailPropertiesComponent } from './ability-detail-properties.component'
import { AbilityDetailStore } from './ability-detail.store'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { IconsModule } from '~/ui/icons'

@Component({
  selector: 'nwb-ability-detail',
  template: `
    <nwb-ability-detail-header />
    <ng-content>
      <div class="p-4">
        @if (!store.isLoaded()) {
          @if (store.isLoading()) {
            <span class="skeleton w-full h-3"></span>
            <div class="flex gap-1">
              <span class="skeleton w-1/3 h-3"></span>
              <span class="skeleton w-1/3 h-3"></span>
            </div>
          }
        } @else if (store.hasError()) {
          <div class="alert text-error">
            <nwb-icon [icon]="iconInfo" class="w-5 h-5" />
            <div class="text-sm">Oh Snap! Something went wrong.</div>
          </div>
        } @else if (!store.ability()) {
          <div class="alert text-error">
            <nwb-icon [icon]="iconInfo" class="w-5 h-5" />
            <div class="text-sm">
              <code class="text-white">{{ store.abilityId() }}</code> does not exist.
            </div>
          </div>
        }
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
    IconsModule,
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

  public abilityChange = outputFromObservable(toObservable(this.store.ability))
}
