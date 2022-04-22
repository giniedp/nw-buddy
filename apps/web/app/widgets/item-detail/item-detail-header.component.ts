import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, map, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-item-detail-header',
  templateUrl: './item-detail-header.component.html',
  styleUrls: ['./item-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDetailHeaderComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public entityId: string

  @Input()
  public type: 'item' | 'housing'

  @Input()
  public entity: ItemDefinitionMaster | Housingitems

  @Input()
  public nwdbLink: boolean

  public get iconPath(): string {
    return this.entity?.IconPath
  }
  public get itemName(): string {
    return this.entity?.Name
  }
  public get itemRarity(): number {
    return this.entity && this.nw.itemRarity(this.entity)
  }
  public get itemRarityName(): string {
    return this.entity && this.nw.itemRarityKey(this.entity)
  }
  public get itemType(): string {
    if (this.entity) {
      if ('ItemID' in this.entity) {
        return this.entity.ItemTypeDisplayName
      } else if ('HouseItemID' in this.entity) {
        return this.entity.ItemType
      }
    }
    return ''
  }

  private destroy$ = new Subject()
  private entityId$ = new ReplaySubject<string>()
  private entity$ = new ReplaySubject<ItemDefinitionMaster | Housingitems>()

  public constructor(private cdRef: ChangeDetectorRef, private nw: NwService) {
    //
  }

  public ngOnInit(): void {
    this.entityId$
      .pipe(switchMap((id) => {
        if (this.type === 'item') {
          return this.nw.db.itemsMap.pipe(map((map) => map.get(id)))
        } else {
          return this.nw.db.housingItemsMap.pipe(map((map) => map.get(id)))
        }
      }))
      .pipe(takeUntil(this.destroy$))
      .subscribe((item) => {
        this.entity$.next(item)
      })

    combineLatest([this.entity$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([item]) => {
        this.entity = item
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

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  private getChange(key: keyof ItemDetailHeaderComponent, ch: SimpleChanges) {
    return ch[key]
  }
}
