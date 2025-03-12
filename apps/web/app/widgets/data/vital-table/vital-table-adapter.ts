import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getVitalCategoryInfo, getVitalDungeons, getVitalFamilyInfo } from '@nw-data/common'
import { COLS_VITALSBASEDATA, VitalsCategory, VitalsCategoryData } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { collectVitalBuffs } from '../vital-detail/vital-detail-buffs.component'
import { VitalGridCellComponent } from './vital-cell.component'
import {
  VitalTableRecord,
  vitalColBuffs,
  vitalColCategories,
  vitalColCreatureType,
  vitalColDmgEffectivenessArcane,
  vitalColDmgEffectivenessFire,
  vitalColDmgEffectivenessIce,
  vitalColDmgEffectivenessLighting,
  vitalColDmgEffectivenessNature,
  vitalColDmgEffectivenessSlash,
  vitalColDmgEffectivenessStrike,
  vitalColDmgEffectivenessThrust,
  vitalColDmgEffectivenessVoid,
  vitalColExpedition,
  vitalColFamily,
  vitalColIcon,
  vitalColLevel,
  vitalColLootDropChance,
  vitalColLootTableId,
  vitalColLootTags,
  vitalColName,
  vitalColSpawnAreas,
  vitalColSpawnCount,
  vitalColSpawnLevels,
  vitalColSpawnPois,
  vitalColSpawnTerritories,
} from './vital-table-cols'
import { uniqBy } from 'lodash'

@Injectable()
export class VitalTableAdapter implements DataViewAdapter<VitalTableRecord> {
  private db = injectNwData()
  private utils: TableGridUtils<VitalTableRecord> = inject(TableGridUtils)
  private config = injectDataViewAdapterOptions<VitalTableRecord>({ optional: true })

  public entityID(item: VitalTableRecord): string {
    return item.VitalsID.toLowerCase()
  }

  public entityCategories(item: VitalTableRecord): DataTableCategory[] {
    if (!item.Family) {
      return null
    }
    return [
      {
        id: item.Family.toLowerCase(),
        label: item.Family,
      },
    ]
  }
  public virtualOptions(): VirtualGridOptions<VitalTableRecord> {
    return VitalGridCellComponent.buildGridOptions()
  }
  public gridOptions(): GridOptions<VitalTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildVitalTableOptions(this.utils)
  }

  public connect() {
    return (
      this.config?.source ||
      combineLatest({
        vitals: this.db.vitalsAll(),
        vitalsMeta: this.db.vitalsMetadataByIdMap(),
        dungeonsMap: this.db.gameModesByIdMap(),
        dungeonMaps: this.db.gameModesMapsAll(),
        categories: this.db.vitalsCategoriesByIdMap(),
        territoriesMap: this.db.territoriesByIdMap(),
        buffMap: this.db.buffBucketsByIdMap(),
        effectMap: this.db.statusEffectsByIdMap(),
        abilitiesMap: this.db.abilitiesByIdMap(),
      }).pipe(
        map(
          ({
            vitals,
            vitalsMeta,
            dungeonsMap,
            dungeonMaps,
            categories,
            territoriesMap,
            buffMap,
            effectMap,
            abilitiesMap,
          }) => {
            return vitals.map((vital): VitalTableRecord => {
              const familyInfo = getVitalFamilyInfo(vital)
              const combatInfo = getVitalCategoryInfo(vital)
              const metadata = vitalsMeta.get(vital.VitalsID)
              const zones = metadata?.territories?.map((id) => territoriesMap.get(id)).filter((it) => !!it)
              const $categories: VitalsCategoryData[] = [
                ...(metadata?.catIDs || []).map((it) => categories.get(it)).filter((it) => !!it),
                ...(vital.VitalsCategories || []).map((it) => categories.get(it)).filter((it) => !!it),
              ].filter((it) => !!it)
              return {
                ...vital,
                $dungeons: getVitalDungeons(vital, dungeonMaps, vitalsMeta).map((it) => dungeonsMap.get(it.GameModeId)),
                $categories: uniqBy($categories, (it) => it.VitalsCategoryID),
                $familyInfo: familyInfo,
                $combatInfo: combatInfo,
                $metadata: vitalsMeta.get(vital.VitalsID),
                $zones: zones,
                $buffs: collectVitalBuffs({
                  bucketIds: (vital.BuffBuckets || '').split(','),
                  buffMap: buffMap,
                  effectMap: effectMap,
                  abilitiesMap: abilitiesMap,
                }),
              }
            })
          },
        ),
      )
    )
  }
}

function buildVitalTableOptions(util: TableGridUtils<VitalTableRecord>) {
  const result: GridOptions<VitalTableRecord> = {
    columnDefs: [
      vitalColIcon(util),
      vitalColName(util),
      vitalColLevel(util),
      vitalColFamily(util),
      vitalColCreatureType(util),
      vitalColCategories(util),
      vitalColLootDropChance(util),
      vitalColLootTableId(util),
      vitalColLootTags(util),
      vitalColExpedition(util),
      vitalColSpawnCount(util),
      vitalColSpawnLevels(util),
      vitalColSpawnTerritories(util),
      vitalColSpawnAreas(util),
      vitalColSpawnPois(util),
      vitalColBuffs(util),
      vitalColDmgEffectivenessSlash(util),
      vitalColDmgEffectivenessThrust(util),
      vitalColDmgEffectivenessStrike(util),
      vitalColDmgEffectivenessFire(util),
      vitalColDmgEffectivenessIce(util),
      vitalColDmgEffectivenessNature(util),
      vitalColDmgEffectivenessVoid(util),
      vitalColDmgEffectivenessLighting(util),
      vitalColDmgEffectivenessArcane(util),
    ],
  }
  addGenericColumns(result, {
    //props: COLS_VITALSDATA,
    props: COLS_VITALSBASEDATA,
  })
  return result
}
