import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core'
import { WeaponItemDefinitions } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, valueCell } from '~/ui/property-grid/cells'
import { TooltipModule } from '~/ui/tooltip'
import { ModelViewerModule } from '~/widgets/model-viewer'

import { WeaponDefinitionDetailStore } from './weapon-definition-detail.store'
import { WeaponScalingChartComponent } from './weapon-scaling-chart.component'

@Component({
  selector: 'nwb-weapon-definition-detail',
  templateUrl: './weapon-definition-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    IconsModule,
    ItemFrameModule,
    PropertyGridModule,
    TooltipModule,
    ModelViewerModule,
    WeaponScalingChartComponent,
  ],
  providers: [DecimalPipe, WeaponDefinitionDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class WeaponDefinitionDetailComponent {
  public weaponId = input<string>(null)
  public disableProperties = input<boolean>(false)
  public disableScaling = input<boolean>(false)

  #fxLoad = effect(() => {
    const recordId = this.weaponId()
    untracked(() => this.store.load(recordId))
  })

  // protected tplCategory = viewChild.required<TemplateRef<any>>('tplCategory')
  // protected tplCategoryInfo = viewChild.required<TemplateRef<any>>('tplCategoryInfo')

  protected store = inject(WeaponDefinitionDetailStore)
  protected decimals = inject(DecimalPipe)

  protected iconInfo = svgInfoCircle

  protected icon = this.store.icon
  protected recordId = this.store.recordId
  // protected isNegative = this.store.isNegative
  // protected displayName = this.store.nameForDisplay
  // protected source = this.store.source
  // protected description = this.store.description
  protected properties = this.store.properties
  protected isLoading = this.store.isLoading
  protected isLoaded = this.store.isLoaded
  protected hasError = this.store.hasError
  protected hasData = computed(() => !!this.store.record())
  protected hasScaling = this.store.hasScaling

  public descriptor = gridDescriptor<WeaponItemDefinitions>(
    {
      // DisplayName: (value) => localizedCell({ value }),
      // Description: (value) => localizedCell({ value }),
      // StatusID: (it) => {
      //   return [
      //     ...statusEffectCells(it),
      //     diffButtonCell({
      //       record: this.store.effect(),
      //       idKey: 'StatusID',
      //     }),
      //   ]
      // },
      // OnDeathStatusEffect: statusEffectCells,
      // OnEndStatusEffect: statusEffectCells,
      // OnStackStatusEffect: statusEffectCells,
      // OnTickStatusEffect: statusEffectCells,
      // RemoveStatusEffects: statusEffectCells,
      // EquipAbility: (value) => linkCell({ value, routerLink: ['ability', value] }),
      // EffectCategories: (value) => value?.map((it) => ({ value: it, template: this.tplCategory() })),
      // RemoveStatusEffectCategories: (value) => value?.map((it) => ({ value: it, template: this.tplCategory() })),
      // PauseInGameModesList: (value) => tagsCell({ value }),
      // LootTags: (value) => tagsCell({ value }),
    },
    (value) => valueCell({ value }),
  )
}

function statusEffectCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    const isLink = it !== 'All'
    return linkCell({ value: it, routerLink: isLink ? ['status-effect', it] : null })
  })
}
