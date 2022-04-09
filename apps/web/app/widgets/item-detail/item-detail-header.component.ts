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
import { ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, map, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-item-detail-header',
  templateUrl: './item-detail-header.component.html',
  styleUrls: ['./item-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDetailHeaderComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public itemId: string

  @Input()
  public item: ItemDefinitionMaster

  @Input()
  public nwdbLink: boolean

  public iconPath: string
  public itemName: string
  public itemRarity: number
  public itemRarityName: string
  public itemType: string

  private destroy$ = new Subject()
  private itemId$ = new ReplaySubject<string>()
  private item$ = new ReplaySubject<ItemDefinitionMaster>()

  public constructor(private cdRef: ChangeDetectorRef, private nw: NwService, private locale: LocaleService) {}

  public ngOnInit(): void {
    this.itemId$
      .pipe(switchMap((id) => this.nw.db.itemsMap.pipe(map((map) => map.get(id)))))
      .pipe(takeUntil(this.destroy$))
      .subscribe((item) => {
        this.item$.next(item)
      })

    combineLatest([this.item$, this.locale.change])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([item]) => {
        this.item = item
        this.iconPath = this.nw.iconPath(item.IconPath)
        this.itemName = this.nw.translate(item.Name)
        this.itemType = item.ItemTypeDisplayName?.replace('@ui_itemtypedescription_', '')
          .split('_')
          .map((it) => it[0].toLocaleUpperCase() + it.substring(1).toLocaleLowerCase())
          .join(' ')
        this.itemRarity = this.nw.itemRarity(item)
        this.itemRarityName = this.nw.itemRarityName(item)
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(ch: SimpleChanges): void {
    if (this.getChange('itemId', ch)) {
      this.itemId$.next(this.itemId)
    }
    if (this.getChange('item', ch)) {
      this.item$.next(this.item)
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
