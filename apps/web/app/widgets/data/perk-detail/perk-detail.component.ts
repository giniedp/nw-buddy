import { DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { PerkDetailDescriptionComponent } from './perk-detail-description.component'
import { PerkDetailHeaderComponent } from './perk-detail-header.component'
import { PerkDetailModsComponent } from './perk-detail-mods.component'
import { PerkDetailPropertiesComponent } from './perk-detail-properties.component'
import { PerkDetailStore } from './perk-detail.store'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'

@Component({
  selector: 'nwb-perk-detail',
  template: `
    <nwb-perk-detail-header />
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
      } @else if (!store.perk()) {
        <div class="alert text-error">
          <nwb-icon [icon]="iconInfo" class="w-5 h-5 text-error" />
          <div class="text-sm">
            <code class="text-white">{{ store.perkId() }}</code> does not exist.
          </div>
        </div>
      }

      <nwb-perk-detail-mods class="nw-item-section" />
      <nwb-perk-detail-description class="nw-item-section" />
      @if (!disableProperties()) {
        <nwb-perk-detail-properties class="nw-item-section" />
      }
      <ng-content />
    </div>
  `,
  exportAs: 'perkDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PerkDetailDescriptionComponent,
    PerkDetailHeaderComponent,
    PerkDetailModsComponent,
    PerkDetailPropertiesComponent,
    IconsModule,
  ],
  providers: [DecimalPipe, PerkDetailStore],
  host: {
    class: 'block rounded-md overflow-clip font-nimbus',
  },
})
export class PerkDetailComponent {
  public readonly store = inject(PerkDetailStore)
  public perkId = input<string>(null)
  public perkChange = outputFromObservable(toObservable(this.store.perk))
  public disableProperties = input<boolean>(false)
  protected iconInfo = svgInfoCircle
  #fxLoad = effect(() => {
    const perkId = this.perkId()
    untracked(() => this.store.load(perkId))
  })
}
