import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Statuseffect } from '@nw-data/generated'
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
    this.store.patchState({ effectId: value })
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

  protected icon = toSignal(this.store.icon$)
  protected recordId = toSignal(this.store.effectId$)
  protected isNegative = toSignal(this.store.isNegative$)
  protected displayName = toSignal(this.store.nameForDisplay$)
  protected source = toSignal(this.store.source$)
  protected description = toSignal(this.store.description$)
  protected properties = toSignal(this.store.properties$)
  protected affixProperties = toSignal(this.store.affixProps$)
  protected costumeModels = toSignal(this.store.costumeModel$)

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
      case 'EffectCategories': {
        return value.map((it) => ({
          value: String(it),
          template: this.tplCategory,
        }))
      }
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
