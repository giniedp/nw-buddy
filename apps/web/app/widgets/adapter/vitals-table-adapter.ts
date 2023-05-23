import { Injectable } from '@angular/core'
import { COLS_VITALS } from '@nw-data/cols'
import { Gamemodes, Vitals, Vitalscategories, Vitalsmetadata } from '@nw-data/types'
import { ColDef, GridOptions } from 'ag-grid-community'
import { Observable, combineLatest, defer, map, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import {
  VitalFamilyInfo,
  getVitalAliasName,
  getVitalCategoryInfo,
  getVitalDamageEffectivenessPercent,
  getVitalDungeons,
  getVitalFamilyInfo,
  getVitalTypeMarker,
  getVitalsCategories,
  isVitalCombatCategory
} from '~/nw/utils'
import { RangeFilter, SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, dataTableProvider } from '~/ui/data-table'
import { assetUrl, humanize, shareReplayRefCount } from '~/utils'

export interface Entity extends Vitals {
  $dungeons: Gamemodes[]
  $categories: Vitalscategories[]
  $familyInfo: VitalFamilyInfo
  $combatInfo: VitalFamilyInfo | null
  $metadata: Vitalsmetadata
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
              icon: getVitalCategoryInfo(data)?.Icon,
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 200,
          valueGetter: this.valueGetter(({ data }) => {
            const name = this.i18n.get(data.DisplayName)
            const alias = this.i18n.get(getVitalAliasName(data.$categories))
            if (alias && name !== alias) {
              return [name, alias]
            }
            return [name]
          }),
          cellRenderer: this.cellRenderer(({ value }) => {
            const [name, alias] = value
            if (!alias) {
              return name
            }
            return `
              <span>${alias}</span><br>
              <span class="italic opacity-50">${name}</span>
            `
          }),
          getQuickFilterText: ({ value }) => value.join(' '),
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
            const icon = assetUrl(getVitalTypeMarker(data))
            const iconEl = icon && `<img src=${icon} class="block object-cover absolute left-0 top-0 h-full w-full" />`
            const spanEl = `<span class="absolute left-0 right-0 top-0 bottom-0 font-bold flex items-center justify-center">${value}</span>`
            return `${iconEl} ${spanEl}`
          }),
        }),
        this.colDef({
          colId: 'family',
          headerValueGetter: () => 'Family',
          field: this.fieldName('Family'),
          valueGetter: this.valueGetter(({ data: { $familyInfo, Family, $combatInfo } }) => {
            if ($combatInfo) {
              return [$familyInfo.ID, $combatInfo.ID]
            }
            return [$familyInfo.ID]
          }),
          valueFormatter: this.valueFormatter(({ data: { $familyInfo, Family, $combatInfo } }) => {
            return this.i18n.get($familyInfo.Name) || Family || ''
          }),
          cellRenderer: this.cellRenderer(({ data: { $familyInfo, Family, $combatInfo } }) => {
            const familyName = this.i18n.get($familyInfo.Name) || Family || ''
            const combatName = $combatInfo ? this.i18n.get($combatInfo.Name) || '' : ''
            if (familyName && combatName) {
              return `
                <span class="line-through">${familyName}</span><br>
                <span class="italic opacity-75 text-xs text-primary">${combatName}</span>
              `
            }
            if ($combatInfo && !combatName) {
              return `
                <span class="line-through">${familyName}</span><br>
                <span class="italic opacity-75 text-xs text-primary">is not affected by any ward, bane or trophy</span>
              `
            }
            return `<span>${familyName}</span>`
          }),
          width: 125,
          getQuickFilterText: ({ value }) => value,
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'creatureType',
          headerValueGetter: () => 'Creature Type',
          width: 150,
          hide: true,
          field: this.fieldName('CreatureType'),
          valueFormatter: ({ value }) => humanize(value),
          getQuickFilterText: ({ value }) => value,
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'categories',
          headerValueGetter: () => 'Categories',
          width: 200,
          valueGetter: this.valueGetter(({ data }) => {
            return data.VitalsCategories || null
          }),
          cellRenderer: this.cellRendererTags(humanize, (value) => {
            return isVitalCombatCategory(value) ? 'badge-error' : 'badge-secondary'
          }),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
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
          colId: 'lootTableId',
          hide: true,
          headerValueGetter: () => 'Loot Table',
          field: this.fieldName('LootTableId'),
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'lootTags',
          hide: true,
          headerValueGetter: () => 'Loot Tags',
          field: this.fieldName('LootTags'),
          cellRenderer: this.cellRendererTags(humanize, (value) => {
            return isVitalCombatCategory(value) ? 'badge-error' : 'badge-secondary'
          }),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
        this.colDef({
          colId: 'expedition',
          headerValueGetter: () => 'Occurance in',
          valueGetter: this.valueGetter(({ data }) => data?.$dungeons?.map((it) => this.i18n.get(it.DisplayName))),
          filter: SelectFilter,
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
  ).pipe(map((options) => appendFields(options, Array.from(Object.entries(COLS_VITALS)))))

  public entities: Observable<Entity[]> = defer(() =>
    combineLatest({
      vitals: this.db.vitals,
      vitalsMeta: this.db.vitalsMetadataMap,
      dungeons: this.db.gameModes,
      categories: this.db.vitalsCategoriesMap,
    })
  )
    .pipe(
      map(({ vitals, vitalsMeta, dungeons, categories }) => {
        return vitals.map((vital): Entity => {
          const familyInfo = getVitalFamilyInfo(vital)
          const combatInfo = getVitalCategoryInfo(vital)
          return {
            ...vital,
            $dungeons: getVitalDungeons(vital, dungeons, vitalsMeta),
            $categories: getVitalsCategories(vital, categories),
            $familyInfo: getVitalFamilyInfo(vital),
            $combatInfo: familyInfo.ID !== combatInfo.ID ? combatInfo : null,
            $metadata: vitalsMeta.get(vital.VitalsID),
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService, private i18n: TranslateService, private info: NwLinkService) {
    super()
  }

  public cellRendererDamage() {
    return this.cellRenderer(({ value }) => {
      if (!value) {
        return null
      }
      const icon = value < 0 ? 'assets/icons/weakattack.png' : 'assets/icons/strongattack.png'
      const text = `${value > 0 ? '+' : ''}${value}%`
      return `
      <div class="flex flex-row items-center justify-center relative">
        <img class="w-8 h-8 mr-1" src="${assetUrl(icon)}"/>
        <span class="font-bold">${text}</span>
      </div>
      `
    })
  }
}

function appendFields(options: GridOptions, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = options.columnDefs.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      field: field,
      hide: true,
    }
    colDef.filter = SelectFilter
    colDef.filterParams = SelectFilter.params({
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    options.columnDefs.push(colDef)
  }
  return options
}
