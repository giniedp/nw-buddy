import { Directive, forwardRef, Input } from '@angular/core'
import { NwDataService } from '~/data'
import { DamageRowDetailStore } from './damage-row-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbDamageRowDetail]',
  exportAs: 'damageRowDetail',
  providers: [
    {
      provide: DamageRowDetailStore,
      useExisting: forwardRef(() => DamageRowDetailDirective),
    },
  ],
})
export class DamageRowDetailDirective extends DamageRowDetailStore {
  @Input()
  public set nwbDamageRowDetail(value: string) {
    this.patchState({ rowId: value })
  }

  public constructor(db: NwDataService) {
    super(db)
  }
}
