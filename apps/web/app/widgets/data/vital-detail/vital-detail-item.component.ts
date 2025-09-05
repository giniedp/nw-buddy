import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { getVitalCategoryInfo, getVitalFamilyInfo, getVitalTypeMarker, isVitalNamed } from '@nw-data/common'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { ItemFrameModule } from '../../../ui/item-frame'
import { VitalDetailStore } from './vital-detail.store'

@Component({
  selector: 'nwb-vital-detail-item',
  template: `
    <nwb-item-header [isRow]="false" [isPadded]="false" class="gap-1">
      <div class="flex flex-row gap-2">
        <a
          [nwbItemIcon]="familyIcon()"
          [nwLinkTooltip]="['vitals', id()]"
          class="aspect-square inline-block"
          [class.w-14]="size() === 'xs'"
          [class.h-14]="size() === 'xs'"
          [class.w-16]="size() === 'sm'"
          [class.h-16]="size() === 'sm'"
          [class.w-20]="size() === 'md'"
          [class.h-20]="size() === 'md'"
          [class.w-24]="size() === 'lg'"
          [class.h-24]="size() === 'lg'"
        >
        </a>
        <nwb-item-header-content
          class="z-10"
          [isNamed]="isNamed()"
          [title]="name() | nwText | nwTextBreak: ' - '"
          [titleLink]="titleLink()"
          [text1]="creatureType() | nwHumanize"
          [text2]="familyName() | nwText"
          [showSkeleton]="store.isLoading() && !store.isLoaded()"
        >
          @if (store.isLoaded() && !store.vital()) {
            <span header-text2 class="text-error"> Not found </span>
          }
        </nwb-item-header-content>
      </div>
      @if (store.isLoaded()) {
        <ng-content />
      }
    </nwb-item-header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, LayoutModule, ItemFrameModule],
  host: {
    class: 'block',
  },
})
export class VitalDetailiItemComponent {
  protected store = inject(VitalDetailStore)

  public size = input<'xs' | 'sm' | 'md' | 'lg'>('md')
  protected id = this.store.vitalId
  protected name = this.store.displayName
  protected creatureType = this.store.creatureType
  protected isNamed = computed(() => isVitalNamed(this.store.vital()))
  protected typeMarker = computed(() => getVitalTypeMarker(this.store.vital()))
  protected familyInfo = computed(() => getVitalFamilyInfo(this.store.vital()))
  protected familyName = computed(() => this.familyInfo()?.Name)
  protected categoryInfos = computed(() => getVitalCategoryInfo(this.store.vital()))
  protected familyIcon = computed(() => this.categoryInfos()?.[0]?.IconBane)
  protected titleLink = computed(() => ['/vitals', this.id()])
  protected setLevel(value: number) {
    this.store.setLevel({ level: value })
  }
}
