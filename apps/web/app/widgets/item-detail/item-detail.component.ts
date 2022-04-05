import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDetailComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public itemId: string

  public item: ItemDefinitionMaster

  public iconPath: string
  public itemName: string
  public itemCategory: string
  public itemDescription: string
  public itemRarity: number
  public itemRarityName: string
  public perks: Array<{ id: string, name: string, description: string, icon: string }>
  public perkBuckets: Array<{ type: string, chance: number, icon: string }>

  private change$ = new ReplaySubject<string>(1)
  private destroy$ = new Subject()

  public constructor(private nw: NwService, private locale: LocaleService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {

    combineLatest([
      this.change$,
      this.nw.db.itemsMap,
      this.nw.db.perksMap,
      this.nw.db.perkBucketsMap,
      this.locale.change,
    ])

      .pipe(takeUntil(this.destroy$))
      .subscribe(([id, items, perks, buckets]) => {
        this.item = items.get(id)

        const item = this.item || {} as ItemDefinitionMaster
        this.iconPath = this.nw.iconPath(item.IconPath)
        this.itemName = this.nw.translate(item.Name)
        this.itemDescription = this.nw.translate(item.Description)
        this.itemCategory = item.ItemClass?.split('+').join(' ')
        this.itemRarity = this.nw.itemRarity(item)
        this.itemRarityName = this.nw.itemRarityName(item)

        this.perks = [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5]
          .map((it) => perks.get(it))
          .filter((it) => !!it)
          .map((it) => {
            return {
              id: it.PerkID,
              name: this.nw.translate(it.DisplayName),
              description: this.nw.translate(it.Description),
              icon: this.nw.iconPath(it.IconPath)
            }
          })
        this.perkBuckets = [item.PerkBucket1, item.PerkBucket2, item.PerkBucket3, item.PerkBucket4, item.PerkBucket5]
          .map((it) => buckets.get(it))
          .filter((it) => !!it)
          .map((it) => {
            return {
              type: it.PerkType,
              chance: it.PerkChance,
              icon: ''
            }
          })

        this.cdRef.markForCheck()
      })

  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.change$.next(this.itemId)
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
