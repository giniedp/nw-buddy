import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getVitalCategoryInfo, getVitalDungeons, getVitalFamilyInfo, getVitalsCategories } from '@nw-data/common'
import { COLS_VITALS } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  VitalGridRecord,
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
} from './vital-grid-cols'

@Injectable()
export class VitalGridSource extends DataGridSource<VitalGridRecord> {
  private db = inject(NwDbService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<VitalGridRecord> = inject(DataGridUtils)

  public override entityID(item: VitalGridRecord): string {
    return item.VitalsID
  }

  public override entityCategories(item: VitalGridRecord): DataGridCategory[] {
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

  public override buildOptions(): GridOptions<VitalGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils)
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
          return vitals.map((vital): VitalGridRecord => {
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

function buildOptions(util: DataGridUtils<VitalGridRecord>) {
  const result: GridOptions<VitalGridRecord> = {
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
