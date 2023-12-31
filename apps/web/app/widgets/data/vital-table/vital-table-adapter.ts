import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getVitalCategoryInfo, getVitalDungeons, getVitalFamilyInfo, getVitalsCategories } from '@nw-data/common'
import { COLS_VITALS, Vitals } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataViewAdapter } from '~/ui/data/data-view'
import {
  DataTableCategory,
  TABLE_GRID_ADAPTER_OPTIONS,
  TableGridAdapter,
  TableGridUtils,
  addGenericColumns,
} from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  VitalTableRecord,
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
  vitalColSpawnCount,
} from './vital-table-cols'
import { CaseInsensitiveSet } from '~/utils'

@Injectable()
export class VitalTableAdapter implements DataViewAdapter<VitalTableRecord>, TableGridAdapter<VitalTableRecord> {
  private db = inject(NwDbService)
  private utils: TableGridUtils<VitalTableRecord> = inject(TableGridUtils)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })

  public entityID(item: VitalTableRecord): string {
    return item.VitalsID
  }

  public entityCategories(item: VitalTableRecord): DataTableCategory[] {
    if (!item.Family) {
      return null
    }
    return [
      {
        id: item.Family,
        label: item.Family,
      },
    ]
  }
  public virtualOptions(): VirtualGridOptions<VitalTableRecord> {
    return null
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
        vitals: this.db.vitals,
        vitalsMeta: this.db.vitalsMetadataMap,
        dungeons: this.db.gameModes,
        categories: this.db.vitalsCategoriesMap,
      }).pipe(
        map(({ vitals, vitalsMeta, dungeons, categories }) => {
          return vitals.map((vital): VitalTableRecord => {
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
        }),
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
    props: COLS_VITALS,
  })
  return result
}
