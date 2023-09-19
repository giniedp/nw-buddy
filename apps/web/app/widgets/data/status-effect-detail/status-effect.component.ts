import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input, TemplateRef, ViewChild } from '@angular/core'
import { Statuseffect } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { StatusEffectDetailStore } from './status-effect.store'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { TooltipModule } from '~/ui/tooltip'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'

@Component({
  standalone: true,
  selector: 'nwb-status-effect-detail',
  templateUrl: './status-effect.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    IconsModule,
    ItemFrameModule,
    PropertyGridModule,
    TooltipModule,
    StatusEffectCategoryDetailModule,
  ],
  providers: [
    DecimalPipe,
    {
      provide: StatusEffectDetailStore,
      useExisting: forwardRef(() => StatusEffectDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class StatusEffectDetailComponent extends StatusEffectDetailStore {
  @Input()
  public set effectId(value: string) {
    this.patchState({ effectId: value })
  }

  @Input()
  public disableProperties: boolean

  @ViewChild('tplCategory', { static: true })
  protected tplCategory: TemplateRef<any>

  protected iconInfo = svgInfoCircle
  public constructor(db: NwDbService, private decimals: DecimalPipe) {
    super(db)
  }

  public formatValue = (value: any, key: keyof Statuseffect): PropertyGridCell[] => {
    switch (key) {
      case 'StatusID':
      case 'OnDeathStatusEffect':
      case 'OnEndStatusEffect':
      case 'OnStackStatusEffect':
      case 'OnTickStatusEffect': {
        return statusEffectCells(value)
      }
      case 'RemoveStatusEffects': {
        return statusEffectCells(value)
      }
      case 'EquipAbility': {
        return [
          {
            value: String(value),
            accent: true,
            routerLink: ['/abilities/table', value],
          },
        ]
      }
      default: {
        if (Array.isArray(value)) {
          return value.map((it) => ({
            value: String(it),
            template: this.tplCategory,
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

function statusEffectCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    const isLink = it !== 'All'
    return {
      value: String(it),
      accent: isLink,
      routerLink: isLink ? ['/status-effects/table', it] : null,
    }
  })
}
