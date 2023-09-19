import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { Damagetable } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { DamageRowDetailStore } from './damage-row-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-damage-row-detail',
  templateUrl: './damage-row-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, DecimalPipe],
  providers: [
    DecimalPipe,
    {
      provide: DamageRowDetailStore,
      useExisting: forwardRef(() => DamageRowDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class DamageRowDetailComponent extends DamageRowDetailStore {
  @Input()
  public set rowId(value: string) {
    this.patchState({ rowId: value })
  }

  public constructor(db: NwDbService, private decimals: DecimalPipe) {
    super(db)
  }

  public formatValue = (value: any, key: keyof Damagetable): PropertyGridCell | PropertyGridCell[] => {
    switch (key) {
      default: {
        if (Array.isArray(value)) {
          return value.map((it) => ({
            value: String(it),
            secondary: true,
          }))
        }
        if (typeof value === 'number') {
          return [
            {
              value: this.decimals.transform(value, '0.0-7'),
              accent: true,
            },
          ]
        }
        return [
          {
            value: String(value),
            accent: typeof value === 'number',
            info: typeof value === 'boolean',
            bold: typeof value === 'boolean',
          },
        ]
      }
    }
  }
}
