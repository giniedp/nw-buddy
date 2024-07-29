import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, forwardRef } from '@angular/core'
import { SpellData } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { valueCell } from '~/ui/property-grid/cells'
import { SpellDetailStore } from './spell-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-spell-detail',
  templateUrl: './spell-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, DecimalPipe],
  providers: [
    DecimalPipe,
    {
      provide: SpellDetailStore,
      useExisting: forwardRef(() => SpellDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class SpellDetailComponent extends SpellDetailStore {
  @Input()
  public set spellId(value: string) {
    this.patchState({ spellId: value })
  }

  public constructor(
    db: NwDataService,
    private decimals: DecimalPipe,
  ) {
    super(db)
  }

  public descriptor = gridDescriptor<SpellData>({}, (value) => valueCell({ value }))
}

function statusEffectCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    const isLink = it !== 'All'
    return {
      value: String(it),
      accent: isLink,
      routerLink: isLink ? ['status-effect', it] : null,
    }
  })
}

function abilitiesCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return {
      value: String(it),
      accent: true,
      routerLink: ['ability', it],
    }
  })
}
