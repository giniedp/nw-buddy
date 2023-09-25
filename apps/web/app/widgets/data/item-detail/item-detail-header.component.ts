import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core'
import { RouterModule } from '@angular/router'
import {
  ItemRarity,
  getItemTierAsRoman,
  isHousingItem,
  isItemArmor,
  isItemJewelery,
  isItemWeapon,
  isMasterItem,
} from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { Subject, combineLatest, takeUntil } from 'rxjs'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemTrackerModule } from '../../item-tracker'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-header',
  templateUrl: './item-detail-header.component.html',
  styleUrls: ['./item-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, ItemTrackerModule, ItemFrameModule],
  host: {
    class: 'nw-item-header relative flex flex-row p-1 gap-2 text-shadow-sm shadow-black',
    '[class.bg-base-300]': 'isLoading',
    '[class.named]': 'isNamed',
    '[class.artifact]': 'isArtifact',
    '[class.nw-item-rarity-common]': '!isLoading && (rarity === "common")',
    '[class.nw-item-rarity-uncommon]': 'rarity === "uncommon"',
    '[class.nw-item-rarity-rare]': 'rarity === "rare"',
    '[class.nw-item-rarity-epic]': 'rarity === "epic"',
    '[class.nw-item-rarity-legendary]': 'rarity === "legendary"',
    '[class.nw-item-rarity-artifact]': 'rarity === "artifact"',
  },
})
export class ItemDetailHeaderComponent implements OnInit, OnDestroy {
  @Input()
  public enableInfoLink: boolean

  @Input()
  public enableLink: boolean

  @Input()
  public enableTracker: boolean

  @Input()
  public disableContent: boolean

  @Input()
  public iconOverride: ItemDefinitionMaster | Housingitems

  @Input()
  public size: 'sm' | 'md' | 'lg' = 'md'

  protected name: string[]

  protected isNamed: boolean
  protected isArtifact: boolean
  protected rarity: ItemRarity
  protected rarityName: string
  protected typeName: string
  protected sourceLabel: string
  protected entity: ItemDefinitionMaster | Housingitems
  protected entityId: string
  protected entityLink: string | any[]
  protected isLoading = true
  protected get enableGsTracker(): boolean {
    return (
      this.enableTracker &&
      isMasterItem(this.entity) &&
      (isItemWeapon(this.entity) || isItemArmor(this.entity) || isItemJewelery(this.entity))
    )
  }
  protected get tierLabel() {
    return getItemTierAsRoman(this.entity?.Tier)
  }

  private destroy$ = new Subject<void>()

  public constructor(protected detail: ItemDetailStore, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      name: this.detail.name$,
      namePrefix: this.detail.namePrefix$,
      nameSuffix: this.detail.nameSuffix$,
      isNamed: this.detail.isNamed$,
      isArtifact: this.detail.isArtifact$,
      rarity: this.detail.finalRarity$,
      rarityName: this.detail.finalRarityName$,
      typeName: this.detail.typeName$,
      sourceLabel: this.detail.sourceLabel$,
      entity: this.detail.entity$,
      entityId: this.detail.entityId$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((it) => {
        this.name = [it.namePrefix, it.name, it.nameSuffix].filter((it) => !!it)
        this.isNamed = it.isNamed
        this.isArtifact = it.isArtifact
        this.rarity = it.rarity
        this.rarityName = it.rarityName
        this.typeName = it.typeName
        this.sourceLabel = it.sourceLabel
        this.entity = it.entity
        this.entityId = it.entityId
        this.entityLink = ['/', isHousingItem(it.entity) ? 'housing' : 'items', 'table', it.entityId]
        if (!it.entity) {
          this.entityLink = null
        }
        this.isLoading = false
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
