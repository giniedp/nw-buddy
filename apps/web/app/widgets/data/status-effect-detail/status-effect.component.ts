import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild, inject } from '@angular/core'
import { StatusEffectData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { StatusEffectDetailStore } from './status-effect.store'

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
    ModelViewerModule,
  ],
  providers: [DecimalPipe, StatusEffectDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class StatusEffectDetailComponent {
  @Input()
  public set effectId(value: string) {
    this.store.load(value)
  }

  @Input()
  public disableProperties: boolean

  @ViewChild('tplCategory', { static: true })
  protected tplCategory: TemplateRef<any>

  @ViewChild('tplCategoryInfo', { static: true })
  protected tplCategoryInfo: TemplateRef<any>

  protected store = inject(StatusEffectDetailStore)
  protected decimals = inject(DecimalPipe)
  protected viewerActive = false
  protected iconInfo = svgInfoCircle

  protected icon = this.store.icon
  protected recordId = this.store.effectId
  protected isNegative = this.store.isNegative
  protected displayName = this.store.nameForDisplay
  protected source = this.store.source
  protected description = this.store.description
  protected properties = this.store.properties
  protected affixProperties = this.store.affixProps
  protected costumeModels = this.store.costumeModels

  public formatValue = (value: any, key: keyof StatusEffectData): PropertyGridCell[] => {
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
      case 'EffectCategories':
      case 'RemoveStatusEffectCategories': {
        return value.map((it) => ({
          value: String(it),
          template: this.tplCategory,
        }))
      }
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
