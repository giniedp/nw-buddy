import { CommonModule } from '@angular/common'
import { Component, computed, inject } from '@angular/core'
import { ItemFrameModule } from '~/ui/item-frame'
import { humanize } from '~/utils'
import { DamageDetailStore } from './damage-row-detail.store'

@Component({
  selector: 'nwb-damage-row-detail-header',
  template: `
    <nwb-item-header class="gap-2">
      <nwb-item-icon [nwbItemIcon]="icon()" class="w-[76px] h-[76px]" />
      <nwb-item-header-content [showSkeleton]="isLoading()" [title]="title()" [text1]="'Damage'">
        <span header-text2 [class.text-error]="!row()">
          @if (row()) {
            {{ subtitle() }} &bullet; {{ attackType() }} &bullet; {{ coeff() | percent }}
          } @else {
            Not found
          }
        </span>
      </nwb-item-header-content>
    </nwb-item-header>
  `,
  imports: [ItemFrameModule, CommonModule],
})
export class DamageRowDetailHeaderComponent {
  private store = inject(DamageDetailStore)
  protected icon = this.store.icon
  protected isLoading = computed(() => this.store.isLoading() && !this.store.isLoaded())
  protected row = this.store.row
  protected title = computed(() => humanize(this.store.row()?.DamageID || this.store.rowId()))
  protected subtitle = computed(() => this.row()?.DamageType || '')
  protected attackType = computed(() => this.row()?.AttackType)
  protected coeff = computed(() => this.row()?.DmgCoef)
}
