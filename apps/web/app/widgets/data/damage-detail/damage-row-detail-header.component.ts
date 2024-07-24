import { Component, computed, inject } from '@angular/core'
import { DamageDetailStore } from './damage-row-detail.store'
import { ItemFrameModule } from '~/ui/item-frame'
import { humanize } from '~/utils'
import { damageTypeIcon } from '~/nw/weapon-types'
import { CommonModule } from '@angular/common'

@Component({
  standalone: true,
  selector: 'nwb-damage-row-detail-header',
  template: `
    <nwb-item-header class="gap-2">
      <nwb-item-icon [nwbItemIcon]="icon()" class="w-[76px] h-[76px]" />
      <nwb-item-header-content
        [isSkeleton]="isLoading()"
        [title]="title()"
        [text1]="'Damage'"
      >
        <span text2>
          {{ subtitle() }} &bullet; {{ attackType() }} &bullet; {{ coeff() | percent}}
        </span>
      </nwb-item-header-content>
    </nwb-item-header>
  `,
  imports: [ItemFrameModule, CommonModule],
})
export class DamageRowDetailHeaderComponent {
  private store = inject(DamageDetailStore)
  protected icon = this.store.icon
  protected isLoading = this.store.isLoading
  protected row = this.store.row
  protected title = computed(() => humanize(this.row()?.DamageID))
  protected subtitle = computed(() => this.row()?.DamageType || '')
  protected attackType = computed(() => this.row()?.AttackType)
  protected coeff = computed(() => this.row()?.DmgCoef)
}
