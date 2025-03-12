import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { EntitlementDetailStore } from './entitlement-detail.store'

@Component({
  selector: 'nwb-entitlement-detail',
  templateUrl: './entitlement-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, RouterModule],
  providers: [DecimalPipe, EntitlementDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class EntitlementDetailComponent {
  public readonly store = inject(EntitlementDetailStore)

  @Input()
  public set entitlementId(value: string) {
    this.store.load({ entitlementId: value })
  }

  protected rewards = this.store.rewards
}
