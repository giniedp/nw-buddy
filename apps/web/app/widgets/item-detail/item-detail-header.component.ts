import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, map, ReplaySubject, switchMap, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'
import { getItemId, getItemRarity, getItemRarityName } from '~/core/nw/utils'
import { DestroyService } from '~/core/utils'

@Component({
  selector: 'nwb-item-detail-header',
  templateUrl: './item-detail-header.component.html',
  styleUrls: ['./item-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService]
})
export class ItemDetailHeaderComponent implements OnInit, OnChanges {
  @Input()
  public entityId: string

  @Input()
  public entity: ItemDefinitionMaster | Housingitems

  @Input()
  public enableNwdbLink: boolean

  @Input()
  public enableTracker: boolean

  @Input()
  public enableMarker: boolean

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
      if ('ItemID' in this.entity) {
        return this.entity.ItemTypeDisplayName
      } else if ('HouseItemID' in this.entity) {
        return this.entity.ItemType
      }
    }
    return ''
  }

  public get itemType(): string {
    if (this.entity) {
      if ('ItemID' in this.entity) {
        return this.entity.ItemType
      } else if ('HouseItemID' in this.entity) {
        return this.entity.ItemType
      }
    }
    return ''
  }

  public get showGsTracker() {
    return this.enableTracker && (this.itemType === 'Weapon' || this.itemType === 'Armor')
  }

  private entityId$ = new ReplaySubject<string>()
  private entity$ = new ReplaySubject<ItemDefinitionMaster | Housingitems>()

  public constructor(private cdRef: ChangeDetectorRef, private nw: NwService, private destroy: DestroyService) {
    //
  }

  public ngOnInit(): void {
    this.entityId$
      .pipe(switchMap((id) => {
        return combineLatest({
          items: this.nw.db.itemsMap,
          housing: this.nw.db.housingItemsMap
        }).pipe(map(({ items, housing }) => {
          return items.get(id) || housing.get(id)
        }))
      }))
      .pipe(takeUntil(this.destroy.$))
      .subscribe((item) => {
        this.entity$.next(item)
      })

    this.entity$
      .pipe(takeUntil(this.destroy.$))
      .subscribe((item) => {
        this.entity = item
        this.entityId = getItemId(item)
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(ch: SimpleChanges): void {
    if (this.getChange('entityId', ch)) {
      this.entityId$.next(this.entityId)
    }
    if (this.getChange('entity', ch)) {
      this.entity$.next(this.entity)
    }
  }

  private getChange(key: keyof ItemDetailHeaderComponent, ch: SimpleChanges) {
    return ch[key]
  }
}
