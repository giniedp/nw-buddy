import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild, inject } from '@angular/core'
import { AffixStatData, DamageData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, valueCell } from '~/ui/property-grid/cells'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { StatusEffectDetailModule } from '../status-effect-detail'
import { DamageRowDetailHeaderComponent } from './damage-row-detail-header.component'
import { DamageDetailStore } from './damage-row-detail.store'

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
    DamageRowDetailHeaderComponent,
  ],
  providers: [DecimalPipe, DamageDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class DamageRowDetailComponent {
  private store = inject(DamageDetailStore)

  @Input()
  public set rowId(value: string) {
    this.store.load({ rowId: value })
  }

  protected iconInfo = svgInfoCircle
  protected trackByIndex = (i: number) => i
  @ViewChild('tplCategoryInfo', { static: true })
  protected tplCategoryInfo: TemplateRef<any>

  protected decimals = inject(DecimalPipe)

  protected properties = this.store.properties
  protected affixProperties = this.store.affixProps
  public effectIds = this.store.effectIds

  public damageDescriptor = gridDescriptor<DamageData>(
    {
      DamageID: (value) => {
        return linkCell({ value, routerLink: ['damage', value] })
      },
      StatusEffect: (value) => {
        return value?.map((it) => {
          if (it === 'All') {
            return valueCell({ value: it })
          }
          return linkCell({ value: it, routerLink: ['status-effect', it] })
        })
      },
    },
    (value) => valueCell({ value: value }),
  )

  public affixDescriptor = gridDescriptor<AffixStatData>({}, (value) => {
    return valueCell({ value: value })
  })
}
