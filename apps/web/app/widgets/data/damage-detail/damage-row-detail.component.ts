import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild, inject } from '@angular/core'
import { AffixStatData, DamageData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { StatusEffectDetailModule } from '../status-effect-detail'
import { DamageRowDetailStore } from './damage-row-detail.store'
import { toSignal } from '@angular/core/rxjs-interop'

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
  providers: [DecimalPipe, DamageRowDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class DamageRowDetailComponent {
  @Input()
  public set rowId(value: string) {
    this.store.patchState({ rowId: value })
  }
  protected iconInfo = svgInfoCircle
  protected trackByIndex = (i: number) => i
  @ViewChild('tplCategoryInfo', { static: true })
  protected tplCategoryInfo: TemplateRef<any>

  protected decimals = inject(DecimalPipe)
  protected store = inject(DamageRowDetailStore)
  protected properties = toSignal(this.store.properties$)
  protected affixProperties = toSignal(this.store.affixProps$)
  public effectIds = toSignal(this.store.statusEffectIds$)

  public formatValue = (value: any, key: keyof DamageData): PropertyGridCell | PropertyGridCell[] => {
    switch (key) {
      case 'DamageID': {
        return damageCells(value as DamageData['DamageID'])
      }
      case 'StatusEffect': {
        return statusEffectCells(value as DamageData['StatusEffect'])
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

  public formatAffixValue = (value: any, key: keyof AffixStatData): PropertyGridCell[] => {
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

function damageCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return {
      value: String(it),
      accent: true,
      routerLink: ['/damage/table'],
      queryParams: { search: it },
    }
  })
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
