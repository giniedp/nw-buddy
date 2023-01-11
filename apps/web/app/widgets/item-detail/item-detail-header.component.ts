import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, Subject, takeUntil } from 'rxjs'
import { NwModule } from '~/nw'
import { getItemTierAsRoman, isItemArmor, isItemWeapon, isMasterItem } from '~/nw/utils'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemTrackerModule } from '../item-tracker'
import { ItemDetailService } from './item-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-header',
  templateUrl: './item-detail-header.component.html',
  styleUrls: ['./item-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemTrackerModule, ItemFrameModule],
  host: {
    class: 'nw-item-header flex flex-row p-1 gap-2',
    '[class.bg-base-300]': 'isLoading',
    '[class.named]': 'named',
    '[class.nw-item-rarity-0]': '!isLoading && !rarity',
    '[class.nw-item-rarity-1]': 'rarity === 1',
    '[class.nw-item-rarity-2]': 'rarity === 2',
    '[class.nw-item-rarity-3]': 'rarity === 3',
    '[class.nw-item-rarity-4]': 'rarity === 4',
  },
})
export class ItemDetailHeaderComponent implements OnInit, OnDestroy {
  @Input()
  public enableInfoLink: boolean

  @Input()
  public enableTracker: boolean

  @Input()
  public disableContent: boolean

  @Input()
  public iconOverride: ItemDefinitionMaster | Housingitems

  protected name: string
  protected named: boolean
  protected rarity: number
  protected rarityName: string
  protected typeName: string
  protected sourceLabel: string
  protected entity: ItemDefinitionMaster | Housingitems
  protected entityId: string
  protected isLoading = true
  protected get enableGsTracker(): boolean {
    return this.enableTracker && isMasterItem(this.entity) && (isItemWeapon(this.entity) || isItemArmor(this.entity))
  }
  protected get tierLabel() {
    return getItemTierAsRoman(this.entity?.Tier)
  }

  private destroy$ = new Subject<void>()

  public constructor(protected detail: ItemDetailService, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      name: this.detail.name$,
      isNamed: this.detail.isNamed$,
      rarity: this.detail.finalRarity$,
      rarityName: this.detail.rarityName$,
      typeName: this.detail.typeName$,
      sourceLabel: this.detail.sourceLabel$,
      entity: this.detail.entity$,
      entityId: this.detail.entityId$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((it) => {
        this.name = it.name
        this.named = it.isNamed
        this.rarity = it.rarity
        this.rarityName = it.rarityName
        this.typeName = it.typeName
        this.sourceLabel = it.sourceLabel
        this.entity = it.entity
        this.entityId = it.entityId
        this.isLoading = false
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
