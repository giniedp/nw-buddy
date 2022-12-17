import { Injectable } from '@angular/core'
import { Gamemodes, Vitals } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import { getVitalDamageEffectivenessPercent, getVitalDungeon } from '~/nw/utils'
import { NwVitalsService } from '~/nw/vitals'
import { RangeFilter, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

export interface Entity extends Vitals {
  $dungeon: Gamemodes
}

@Injectable()
export class VitalsTableAdapter extends DataTableAdapter<Entity> {
  public static provider() {
    return dataTableProvider({
      adapter: VitalsTableAdapter,
    })
  }

  public entityID(item: Vitals): string {
    return item.VitalsID
  }

  public entityCategory(item: Vitals): string {
    return item.Family
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: this.info.link('vitals', data.VitalsID),
              target: '_blank',
              icon: this.vitals.vitalFamilyIcon(data),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 200,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DisplayName)),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'level',
          headerValueGetter: () => 'Level',
          width: 150,
          minWidth: 150,
          maxWidth: 150,
          resizable: false,
          field: this.fieldName('Level'),
          cellClass: '',
          cellRenderer: this.cellRenderer(({ data, value }) => {
            const icon = this.vitals.vitalMarkerIcon(data)
            const iconEl = icon && `<img src=${icon} class="block object-cover absolute left-0 top-0 h-full w-full" />`
            const spanEl = `<span class="absolute left-0 right-0 top-0 bottom-0 font-bold flex items-center justify-center">${value}</span>`
            return `${iconEl} ${spanEl}`
          }),
        }),
        this.colDef({
          colId: 'family',
          headerValueGetter: () => 'Family',
          field: this.fieldName('Family'),
          width: 125,
          getQuickFilterText: ({ value }) => value,
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'creatureType',
          headerValueGetter: () => 'Creature Type',
          width: 150,
          field: this.fieldName('CreatureType'),
          valueFormatter: ({ value }) => humanize(value),
          getQuickFilterText: ({ value }) => value,
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'lootDropChance',
          headerValueGetter: () => 'Loot Drop Chance',
          field: this.fieldName('LootDropChance'),
          cellClass: 'text-right',
          width: 150,
          filter: RangeFilter,
          valueGetter: this.valueGetter(({ data }) => Math.round((Number(data.LootDropChance) || 0) * 100)),
          valueFormatter: ({ value }) => `${value}%`,
        }),
        this.colDef({
          colId: 'expedition',
          headerValueGetter: () => 'Expedition',
          valueGetter: this.valueGetter(({ data }) => data?.$dungeon?.DisplayName),
          valueFormatter: ({ value }) => this.i18n.get(value),
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'dmgEffectivenessSlash',
          headerValueGetter: () => 'Slash',
          filter: false,
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          valueGetter: this.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Slash')),
          cellRenderer: this.cellRendererDamage(),
        }),
        this.colDef({
          colId: 'dmgEffectivenessThrust',
          headerValueGetter: () => 'Thrust',
          filter: false,
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          valueGetter: this.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Thrust')),
          cellRenderer: this.cellRendererDamage(),
        }),
        this.colDef({
          colId: 'dmgEffectivenessStrike',
          headerValueGetter: () => 'Strike',
          filter: false,
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          valueGetter: this.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Strike')),
          cellRenderer: this.cellRendererDamage(),
        }),
        this.colDef({
          colId: 'dmgEffectivenessFire',
          headerValueGetter: () => 'Fire',
          filter: false,
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          valueGetter: this.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Fire')),
          cellRenderer: this.cellRendererDamage(),
        }),
        this.colDef({
          colId: 'dmgEffectivenessIce',
          headerValueGetter: () => 'Ice',
          filter: false,
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          valueGetter: this.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Ice')),
          cellRenderer: this.cellRendererDamage(),
        }),
        this.colDef({
          colId: 'dmgEffectivenessNature',
          headerValueGetter: () => 'Nature',
          filter: false,
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          valueGetter: this.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Nature')),
          cellRenderer: this.cellRendererDamage(),
        }),
        this.colDef({
          colId: 'dmgEffectivenessVoid',
          headerValueGetter: () => 'Void',
          filter: false,
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          valueGetter: this.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Corruption')),
          cellRenderer: this.cellRendererDamage(),
        }),
        this.colDef({
          colId: 'dmgEffectivenessLighting',
          headerValueGetter: () => 'Lighting',
          filter: false,
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          valueGetter: this.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Lightning')),
          cellRenderer: this.cellRendererDamage(),
        }),
        this.colDef({
          colId: 'dmgEffectivenessArcane',
          headerValueGetter: () => 'Arcane',
          filter: false,
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          valueGetter: this.valueGetter(({ data }) => getVitalDamageEffectivenessPercent(data, 'Arcane')),
          cellRenderer: this.cellRendererDamage(),
        }),
      ],
    })
  )

  public entities: Observable<Entity[]> = defer(() =>
    combineLatest({
      vitals: this.db.vitals,
      dungeons: this.db.gameModes,
    })
  )
    .pipe(
      map(({ vitals, dungeons }) => {
        return vitals.map((vital) => {
          return {
            ...vital,
            $dungeon: getVitalDungeon(vital, dungeons),
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(
    private db: NwDbService,
    private i18n: TranslateService,
    private vitals: NwVitalsService,
    private info: NwLinkService
  ) {
    super()
  }

  public cellRendererDamage() {
    return this.cellRenderer(({ value }) => {
      if (!value) {
        return null
      }
      const icon = value < 0 ? this.vitals.iconWeakattack : this.vitals.iconStronattack
      const text = `${value > 0 ? '+' : ''}${value}%`
      return `
      <div class="flex flex-row items-center justify-center relative">
        <img class="w-8 h-8 mr-1" src="${icon}"/>
        <span class="font-bold">${text}</span>
      </div>
      `
    })
  }
}
