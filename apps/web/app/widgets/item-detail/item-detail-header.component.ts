import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  ChangeDetectorRef,
} from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { takeUntil } from 'rxjs'
import { getItemId, getItemRarity, getItemRarityName, isHousingItem, isMasterItem } from '~/core/nw/utils'
import { DestroyService } from '~/core/utils'
import { ItemDetailService } from './item-detail.service'

@Component({
  selector: 'nwb-item-detail-header',
  templateUrl: './item-detail-header.component.html',
  styleUrls: ['./item-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  host: {
    '[class.v-lg]': 'size === "lg"',
    '[class.v-sm]': 'size === "sm"'
  }
})
export class ItemDetailHeaderComponent implements OnInit, OnChanges {

  public entity: ItemDefinitionMaster | Housingitems

  @Input()
  public enableNwdbLink: boolean

  @Input()
  public enableTracker: boolean

  @Input()
  public enableMarker: boolean

  @Input()
  public size: 'sm' | 'lg' | 'md' = 'md'

  public get entityId() {
    return getItemId(this.entity)
  }

  public get iconPath(): string {
    return this.entity?.IconPath
  }
  public get itemName(): string {
    return this.entity?.Name
  }
  public get itemRarity(): number {
    return getItemRarity(this.entity)
  }
  public get itemRarityName(): string {
    return getItemRarityName(this.entity)
  }
  public get itemTypeName(): string {
    if (this.entity) {
      if (isMasterItem(this.entity)) {
        return this.entity.ItemTypeDisplayName
      }
      if (isHousingItem(this.entity)) {
        return this.entity.ItemType
      }
    }
    return ''
  }
  public get itemType(): string {
    return this.entity?.ItemType || ''
  }
  public get showGsTracker() {
    return this.enableTracker && (this.itemType === 'Weapon' || this.itemType === 'Armor')
  }

  public constructor(
    private cdRef: ChangeDetectorRef,
    private destroy: DestroyService,
    private service: ItemDetailService
  ) {
    //
  }

  public ngOnInit(): void {
    this.service.entity$.pipe(takeUntil(this.destroy.$)).subscribe((it) => {
      this.entity = it
      this.cdRef.markForCheck()
    })
  }

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }
}
