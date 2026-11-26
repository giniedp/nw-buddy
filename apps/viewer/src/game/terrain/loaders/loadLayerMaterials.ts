import { PriorityLane, SchedulerSystem, type ScheduledTask } from '@gglib/components'
import type { ResourceScope } from '@gglib/graphics'
import type { RegionMaterial } from '../../../api'
import { materialAssetPath, type ContentService } from '../../../content'
import type { TerrainCompositeMaterial } from '../../../material'
import type { TerrainMaterialLayer } from '../TerrainRegionComponent'

export function loadLayerMaterials(
  content: ContentService,
  scheduler: SchedulerSystem,
  scope: ResourceScope,
  data: RegionMaterial,
  done: (result: TerrainMaterialLayer[]) => void,
): ScheduledTask {
  return scheduler.schedule<TerrainMaterialLayer[]>({
    lane: PriorityLane.Critical,
    context: [],
    load: async (task, signal) => {
      for (const layer of data.layers || []) {
        if (layer.affectedTiles === '0') {
          // skip layers that are marked as not affecting anything
          // seems to be safe, splat and material textures are usually some dummy data
          continue
        }

        const splat = await content.loadTexture(layer.splatMap, scope)
        // the material may be shared with other regions (loader cache), region state lives in the layer entry
        const material = (await content.loader.loadMaterial(materialAssetPath(layer.material), {
          baseUrl: content.nwbtFileUrl,
          scope,
        })) as TerrainCompositeMaterial

        task.context.push({
          material,
          splat,
          affectedTiles: BigInt.asUintN(64, BigInt(layer.affectedTiles)),
        })

        if (signal.aborted) {
          return
        }
      }
    },
    finalize: (task, err) => {
      if (err || !task.context) {
        // shared textures, other users may still hold them
        for (const layer of task.context || []) {
          if (layer.splat) {
            scope.drop(layer.splat)
          }
        }
        done([])
        return
      }
      done(task.context)
    },
  })
}
