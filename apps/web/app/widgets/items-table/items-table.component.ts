import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  NgZone,
} from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { isEqual } from 'lodash'
import { combineLatest, map, Subject, takeUntil } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'

function fieldName(key: keyof ItemDefinitionMaster) {
  return key
}

function field(item: any, key: keyof ItemDefinitionMaster) {
  return item[key]
}

@Component({
  selector: 'nwb-items-table',
  templateUrl: './items-table.component.html',
  styleUrls: ['./items-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsTableComponent implements OnInit, OnChanges, OnDestroy {
  public get data() {
    return this.items
  }

  public gridOptions = this.nw.gridOptions({
    rowSelection: 'single',
    onSelectionChanged: (it) => {
      const ids = it.api.getSelectedRows().map((it) => field(it, 'ItemID'))
      this.zone.run(() => this.selectionChange.next(ids))
    },
    columnDefs: [
      {
        sortable: false,
        filter: false,
        width: 74,
        cellRenderer: ({ data }) => {
          const rarity = this.nw.itemRarity(data)
          const iconPath = this.nw.iconPath(field(data, 'IconPath'))
          const icon = this.nw.renderIcon(iconPath, {
            size: 38,
            rarity: rarity,
          })
          return `<a href="${this.nw.nwdbLinkUrl('item', field(data, 'ItemID'))}" target="_blank">${icon}</a>`
        },
      },
      {
        headerName: 'Name',
        valueGetter: ({ data }) => this.nw.translate(field(data, 'Name')),
        width: 300,
      },
      {
        field: fieldName('ItemID'),
        hide: true,
      },
      {
        headerName: 'Perks',
        cellRenderer: (params: { data: ItemDefinitionMaster }) => {
          const item = params.data
          const perks = [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5]
            .filter((it) => !!it)
            .map((it) => this.perks.get(it))
            .filter((it) => !!it)
            .map((it) => {
              const iconPath = this.nw.iconPath(it.IconPath)
              const icon = this.nw.renderIcon(iconPath, { size: 24 })
              return `<a href="${this.nw.nwdbLinkUrl('perk', it.PerkID)}" target="_blank">${icon}</a>`
            })
            .join(' ')
          const generated = [item.PerkBucket1, item.PerkBucket2, item.PerkBucket3, item.PerkBucket4, item.PerkBucket5]
            .filter((it) => !!it)
            .map(() => {
              return this.nw.renderIcon('/nw-data/crafting/crafting_perkbackground.webp', { size: 24 })
            })
            .join(' ')
          return perks + generated
        },
      },
      {
        headerName: 'Source',
        field: '$source',
        width: 125,
      },
      {
        headerName: 'Rarity',
        valueGetter: ({data}) => this.nw.itemRarityName(data),
        width: 130,
      },
      {
        field: fieldName('Tier'),
        width: 100,
      },
      {
        headerName: 'GS Min',
        field: fieldName('MinGearScore'),
        width: 100,
      },
      {
        headerName: 'GS Max',
        field: fieldName('MaxGearScore'),
        width: 100,
      },
      {
        field: fieldName('ItemType'),
        width: 125,
      },
      {
        field: fieldName('ItemClass'),
        // width: 125,
      },
      {
        field: fieldName('TradingGroup'),
        // width: 125,
      },
      {
        field: fieldName('TradingFamily'),
        width: 125,
      },
      {
        field: fieldName('TradingCategory'),
        width: 125,
      },
    ],
  })

  @Input()
  public selection: string[]

  @Output()
  public selectionChange = new EventEmitter<string[]>()

  @Input()
  public filter: (item: ItemDefinitionMaster) => boolean

  private items: ItemDefinitionMaster[]
  private perks: Map<string, Perks>
  private destroy$ = new Subject()

  public constructor(
    private locale: LocaleService,
    private nw: NwService,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  public async ngOnInit() {
    const item$ = this.nw.db.items.pipe(map((items) => (this.filter ? items.filter(this.filter) : items)))
    const perk$ = this.nw.db.perksMap

    combineLatest([item$, perk$, this.locale.change])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([items, perks]) => {
        this.items = items
        this.perks = perks
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(changes: SimpleChanges) {
    const selection = this.getChange(changes, 'selection')
    if (selection) {
      this.select(selection.currentValue)
    }
  }

  public ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  private getChange(ch: SimpleChanges, key: keyof ItemsTableComponent) {
    return ch[key]
  }

  private select(toSelect: string[]) {
    const api = this.gridOptions.api
    if (!api) {
      return
    }
    if (isEqual(toSelect, api.getSelectedRows().map((it) => field(it, 'ItemID')))) {
      return
    }
    api.forEachNode((it) => {
      if (toSelect.includes(field(it.data, 'ItemID'))) {
        it.setSelected(true, false, true)
      } else if (it.isSelected()) {
        it.setSelected(false, false, true)
      }
    })
  }
}
