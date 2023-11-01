import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input, TemplateRef, ViewChild } from '@angular/core'
import { Affixstats, Damagetable } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { DamageRowDetailStore } from './damage-row-detail.store'
import { StatusEffectDetailModule } from '../status-effect-detail'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { TooltipModule } from '~/ui/tooltip'
import { svgInfoCircle } from '~/ui/icons/svg'
import { IconsModule } from '~/ui/icons'

@Component({
  standalone: true,
  selector: 'nwb-damage-row-detail',
  templateUrl: './damage-row-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemFrameModule,
    PropertyGridModule,
    DecimalPipe,
    StatusEffectCategoryDetailModule,
    StatusEffectDetailModule,
    TooltipModule,
    IconsModule,
  ],
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
  protected iconInfo = svgInfoCircle
  protected trackByIndex = (i: number) => i
  @ViewChild('tplCategoryInfo', { static: true })
  protected tplCategoryInfo: TemplateRef<any>

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

  public formatAffixValue = (value: any, key: keyof Affixstats): PropertyGridCell[] => {
    switch (key) {
      default: {
        if (typeof value === 'number') {
          return [
            {
              value: this.decimals.transform(value, '0.0-7'),
              accent: true,
            },
            {
              template: this.tplCategoryInfo,
              value: key,
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
