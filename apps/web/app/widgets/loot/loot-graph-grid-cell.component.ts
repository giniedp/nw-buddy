import { CommonModule } from '@angular/common'
import { Component, Input, computed, inject, signal } from '@angular/core'
import { isLootTagKnownCondition } from '@nw-data/common'
import { NwModule } from '~/nw'
import { LootBucketRowNode } from '~/nw/loot/loot-graph'
import { VirtualGridCellComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgClover, svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive } from '~/utils'
import { ItemDetailStore } from '../data/item-detail'
import { EmptyComponent } from '../empty'
import { LootGraphService } from './loot-graph.service'
import { LootTagComponent } from './loot-tag.component'

@Component({
  selector: 'nwb-loot-graph-grid-cell',
  template: `
    <nwb-item-header
      [isNamed]="isNamed() || isArtifact()"
      [rarity]="rarity()"
      [isRow]="false"
      [isPadded]="false"
      class="h-full"
    >
      <div class="flex-1 flex flex-row gap-1 p-1">
        <a [nwLinkTooltip]="['item', itemId()]" [nwbItemIcon]="entity()" [isNamed]="isNamed()" class="w-14 h-14"> </a>
        <nwb-item-header-content
          [rarity]="rarity()"
          [isNamed]="isNamed()"
          [title]="itemName() | nwText"
          [text1]="rarityName() | nwText"
          [text2]="typeName() | nwText"
          [titleLink]="['item', itemId()] | nwLink"
          class="whitespace-nowrap"
        />
      </div>
      <div class="flex-none flex flex-row gap-1 p-1 bg-black/40 w-full overflow-auto">
        @if (chanceRel || rollThreshold) {
          <span
            class="whitespace-nowrap badge badge-sm cursor-help"
            [class.badge-primary]="chanceRel > 0"
            [class.text-shadow-none]="chanceRel > 0"
            [class.badge-error]="!(chanceRel > 0)"
            [tooltip]="tplChanceTip"
          >
            @if (rollThreshold) {
              ≥ {{ rollThreshold }}
            }
            @if (chanceRel && rollThreshold) {
              ⇒
            }
            @if (chanceRel) {
              {{ chanceRel | percent: '0.0-3' }}
            }
            @if (luckNeeded) {
              <nwb-icon [icon]="iconLuck" class="ml-1 -mr-1 w-[14px] h-[14px]" />
            }
          </span>
        }
        @if (condition(); as condition) {
          <nwb-loot-tag [checked]="condition.checked" [tooltip]="condition.tooltip">
            {{ condition.label }}
          </nwb-loot-tag>
        }
        @if (quantity(); as quantity) {
          <span class="badge badge-sm badge-primary text-shadow-none whitespace-nowrap" [tooltip]="'Quantity'">
            {{ quantity }} &times;
          </span>
        }
        @if (odds(); as odds) {
          <span class="badge badge-sm text-shadow-none whitespace-nowrap px-1" [tooltip]="'Odds'">
            🎲{{ odds | percent }}
          </span>
        }
        @if (matchOne()) {
          <span
            class="whitespace-nowrap badge badge-sm cursor-help badge-info"
            [tooltip]="'Must match only one of the given tags if any are present.'"
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
    <ng-template #tplChanceTip>
      <table class="table table-sm p-1">
        <tr>
          <th>Chance to hit this entry</th>
          <td class="text-right font-mono text-accent">{{ chanceRel | percent: '0.5-5' }}</td>
        </tr>
        <tr>
          <th>Cumulative chance</th>
          <td class="text-right font-mono text-accent">{{ chanceAbs | percent: '0.5-5' }}</td>
        </tr>
        @if (odds()) {
          <tr>
            <th>Cumulative with odds</th>
            <td class="text-right font-mono text-accent">{{ chanceAbs * odds() | percent: '0.5-5' }}</td>
          </tr>
        }
      </table>
    </ng-template>
  `,
  imports: [CommonModule, NwModule, ItemFrameModule, LootTagComponent, IconsModule, TooltipModule],
  providers: [ItemDetailStore],
  host: {
    class: 'block rounded-md overflow-clip m-1',
    '[class.outline]': 'selected || isHighlighted()',
    '[class.outline-primary]': 'selected && !isHighlighted()',
    '[class.outline-accent]': 'isHighlighted()',
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
  // private nodeStore = inject(LootGraphNodeStore)
  private graph = inject(LootGraphService)

  @Input()
  public selected: boolean

  @Input()
  public set data(node: LootBucketRowNode) {
    this.node.set(node)
    this.itemStore.load({ recordId: node.data.Item })
  }
  public get data() {
    return this.node()
  }

  protected iconLuck = svgClover
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
        chance: node.chance,
        chanceAbsolute: node.chanceCumulative,
      }
    }
    return null
  })
  protected odds = computed(() => {
    return this.node()?.data?.Odds
  })

  protected get rollThreshold() {
    const table = this.parentTable()
    const row = this.row()
    if (table && row && table.MaxRoll > 0) {
      return row.Prob
    }
    return null
  }

  protected get chanceRel() {
    return this.node()?.chance
  }
  protected get chanceAbs() {
    return this.node()?.chanceCumulative
  }

  protected get luckNeeded() {
    return this.node()?.luckNeeded
  }
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
      label: `≥ ${prob}`,
      value: prob,
      checked: this.service.isTagInContext(tag, prob),
      tooltip: `The ${tag} must be ≥ ${prob}`,
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
  protected isNamed = this.itemStore.isNamed
  protected isArtifact = this.itemStore.isArtifact
  protected itemName = this.itemStore.fullName
  protected rarity = this.itemStore.rarity
  protected rarityName = this.itemStore.rarityLabel
  protected typeName = this.itemStore.typeName
  protected entity = this.itemStore.record
  protected itemId = this.itemStore.recordId
  protected isHighlighted = computed(() => {
    return eqCaseInsensitive(this.graph.highlight, this.itemId())
  })
}
