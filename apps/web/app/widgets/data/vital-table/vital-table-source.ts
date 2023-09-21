import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getVitalCategoryInfo, getVitalDungeons, getVitalFamilyInfo, getVitalsCategories } from '@nw-data/common'
import { COLS_VITALS } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DATA_TABLE_SOURCE_OPTIONS, DataTableSource, DataTableUtils } from '~/ui/data-grid'
import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
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
} from './vital-table-cols'

@Injectable()
export class VitalTableSource extends DataTableSource<VitalTableRecord> {
  private db = inject(NwDbService)
  private utils: DataTableUtils<VitalTableRecord> = inject(DataTableUtils)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })

  public override entityID(item: VitalTableRecord): string {
    return item.VitalsID
  }

  public override entityCategories(item: VitalTableRecord): DataTableCategory[] {
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

  public override gridOptions(): GridOptions<VitalTableRecord> {
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
        })
      )
    )
  }
}

function buildVitalTableOptions(util: DataTableUtils<VitalTableRecord>) {
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
