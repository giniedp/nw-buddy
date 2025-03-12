import { CommonModule, DecimalPipe } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core'
import { StatusEffectData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, localizedCell, tagsCell, valueCell } from '~/ui/property-grid/cells'
import { TooltipModule } from '~/ui/tooltip'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { StatusEffectDetailStore } from './status-effect.store'
import { diffButtonCell } from '~/widgets/diff-tool'

@Component({
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
  public effectId = input<string>(null)
  public disableProperties = input<boolean>(false)

  #fxLoad = effect(() => {
    const effectId = this.effectId()
    untracked(() => this.store.load(effectId))
  })

  protected tplCategory = viewChild.required<TemplateRef<any>>('tplCategory')
  protected tplCategoryInfo = viewChild.required<TemplateRef<any>>('tplCategoryInfo')

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
  protected isLoading = this.store.isLoading
  protected isLoaded = this.store.isLoaded
  protected hasError = this.store.hasError
  protected hasData = computed(() => !!this.store.effect())

  public descriptor = gridDescriptor<StatusEffectData>(
    {
      DisplayName: (value) => localizedCell({ value }),
      Description: (value) => localizedCell({ value }),
      StatusID: (it) => {
        return [
          ...statusEffectCells(it),
          diffButtonCell({
            record: this.store.effect(),
            idKey: 'StatusID',
          }),
        ]
      },
      OnDeathStatusEffect: statusEffectCells,
      OnEndStatusEffect: statusEffectCells,
      OnStackStatusEffect: statusEffectCells,
      OnTickStatusEffect: statusEffectCells,
      RemoveStatusEffects: statusEffectCells,
      EquipAbility: (value) => linkCell({ value, routerLink: ['ability', value] }),
      EffectCategories: (value) => value?.map((it) => ({ value: it, template: this.tplCategory() })),
      RemoveStatusEffectCategories: (value) => value?.map((it) => ({ value: it, template: this.tplCategory() })),
      PauseInGameModesList: (value) => tagsCell({ value }),
      LootTags: (value) => tagsCell({ value }),
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
