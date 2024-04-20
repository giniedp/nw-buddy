import { CommonModule } from '@angular/common'
import { Component, Input, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { isLootTagKnownCondition } from '@nw-data/common'
import { NwModule } from '~/nw'
import { LootBucketRowNode } from '~/nw/loot/loot-graph'
import { VirtualGridCellComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailStore } from '../data/item-detail'
import { EmptyComponent } from '../empty'
import { LootGraphService } from './loot-graph.service'
import { LootTagComponent } from './loot-tag.component'

@Component({
  standalone: true,
  selector: 'nwb-loot-graph-grid-cell',
  template: `
    <nwb-item-header
      [isNamed]="isNamed() || isArtifact()"
      [rarity]="rarity()"
      [isColumn]="true"
      [isPadded]="false"
      class="h-full"
    >
      <div class="flex-1 flex flex-row gap-1 p-1">
        <a
          [nwLink]="itemId()"
          [nwLinkResource]="'item'"
          [nwbItemIcon]="entity()"
          [isNamed]="isNamed()"
          class="w-14 h-14"
        >
        </a>
        <nwb-item-header-content
          [rarity]="rarity()"
          [isNamed]="isNamed()"
          [title]="itemName() | nwText"
          [text1]="rarityName() | nwText"
          [text2]="typeName() | nwText"
          class="whitespace-nowrap"
        />
      </div>
      <div class="flex-none flex flex-row gap-1 p-1 bg-black bg-opacity-40 w-full overflow-auto">
        @if (roll(); as roll) {
          <span class="whitespace-nowrap badge badge-sm badge-primary text-shadow-none">
            >= {{ roll.threshold }}
            @if (roll.chance; as chance) {
              ({{ chance | percent: '1.0-2' }})
            }
          </span>
        }
        @if (condition(); as condition) {
          <nwb-loot-tag [tag]="'>= ' + condition.prob" [checked]="condition.checked" />
        }
        @if (quantity(); as quantity) {
          <span class="badge badge-sm badge-primary text-shadow-none whitespace-nowrap"> {{ quantity }} &times; </span>
        }
        @if (matchOne()) {
          <span
            class="whitespace-nowrap badge badge-sm cursor-help"
            [class.badge-error]="!tags()?.length"
            [class.badge-info]="!!tags()?.length"
            [tooltip]="
              !tags()?.length
                ? 'No tags to match against. This item is not obtainable'
                : 'Must match only one of the given tags'
            "
          >
            MatchOne
          </span>
        }
        @for (item of tags(); track $index) {
          <nwb-loot-tag
            [tag]="item.tag"
            [tagValue]="item.value"
            [checked]="item.checked"
            [actions]="item.canEdit"
            (addClicked)="service.addTagClicked.emit($event)"
            (removeClicked)="service.removeTagClicked.emit($event)"
          />
        }
      </div>
    </nwb-item-header>
  `,
  imports: [CommonModule, NwModule, ItemFrameModule, LootTagComponent, IconsModule, TooltipModule],
  providers: [ItemDetailStore],
  host: {
    class: 'block rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class LootGraphGridCellComponent extends VirtualGridCellComponent<LootBucketRowNode> {
  public static buildGridOptions(): VirtualGridOptions<LootBucketRowNode> {
    return {
      width: 320,
      height: 95,

      cellDataView: LootGraphGridCellComponent,
      cellEmptyView: EmptyComponent,
    }
  }

  @Input()
  public selected: boolean

  @Input()
  public set data(node: LootBucketRowNode) {
    this.node.set(node)
    this.itemStore.patchState({ recordId: node.data.Item })
  }
  public get data() {
    return this.node()
  }

  protected iconInfo = svgInfoCircle
  protected node = signal<LootBucketRowNode>(null)
  protected row = computed(() => this.node()?.row)
  protected parentTable = computed(() => {
    const parent = this.node().parent
    if (parent?.type === 'table') {
      return parent.data
    }
    return null
  })

  protected roll = computed(() => {
    const node = this.node()
    const table = this.parentTable()
    const row = this.row()
    if (table && row && table.MaxRoll > 0) {
      return {
        threshold: row.Prob,
        chance: node.chanceRelative,
        chanceAbsolute: node.chanceAbsolute,
      }
    }
    return null
  })

  protected quantity = computed(() => {
    return this.node()?.data.Quantity?.join('-')
  })

  protected matchOne = computed(() => {
    return this.node()?.data.MatchOne
  })

  protected condition = computed(() => {
    if (this.roll()) {
      return null
    }

    const tag = this.parentTable()?.Conditions?.find(isLootTagKnownCondition)
    if (!tag) {
      return null
    }
    const prob = this.row().Prob
    return {
      tag,
      prob,
      checked: this.service.isTagInContext(tag, prob),
    }
  })

  protected tags = computed(() => {
    const node = this.node()
    return Array.from(node.data?.Tags?.values() || []).map((it) => {
      const isChecked = this.service.isTagInContext(it.name, it.value)
      const canEdit = this.service.tagsEditable && !it.value
      return {
        tag: it.name,
        value: it.value?.join('-'),
        checked: isChecked,
        canEdit,
      } as const
    })
  })

  protected service = inject(LootGraphService)
  private itemStore = inject(ItemDetailStore)
  protected isNamed = toSignal(this.itemStore.isNamed$)
  protected isArtifact = toSignal(this.itemStore.isArtifact$)
  protected itemName = toSignal(this.itemStore.name$)
  protected rarity = toSignal(this.itemStore.rarity$)
  protected rarityName = toSignal(this.itemStore.rarityName$)
  protected typeName = toSignal(this.itemStore.typeName$)
  protected entity = toSignal(this.itemStore.entity$)
  protected itemId = toSignal(this.itemStore.recordId$)
}
