import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core'
import { ArmorItemDefinitions, WeaponItemDefinitions } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, valueCell } from '~/ui/property-grid/cells'
import { TooltipModule } from '~/ui/tooltip'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { ArmorDefinitionDetailStore } from './armor-definition-detail.store'

@Component({
  selector: 'nwb-armor-definition-detail',
  templateUrl: './armor-definition-detail.component.html',
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
  ],
  providers: [DecimalPipe, ArmorDefinitionDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class ArmorDefinitionDetailComponent {
  public armorId = input<string>(null)
  public disableProperties = input<boolean>(false)
  public disableScaling = input<boolean>(false)

  #fxLoad = effect(() => {
    const recordId = this.armorId()
    untracked(() => this.store.load(recordId))
  })

  protected store = inject(ArmorDefinitionDetailStore)
  protected decimals = inject(DecimalPipe)

  protected iconInfo = svgInfoCircle

  protected icon = this.store.icon
  protected recordId = this.store.recordId

  protected properties = this.store.properties
  protected isLoading = this.store.isLoading
  protected isLoaded = this.store.isLoaded
  protected hasError = this.store.hasError
  protected hasData = computed(() => !!this.store.record())

  public descriptor = gridDescriptor<ArmorItemDefinitions>(
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
