import { PriorityLane, SchedulerSystem, type ScheduledTask } from '@gglib/components'
import type { ResourceScope, Texture } from '@gglib/graphics'
import type { RegionMaterial } from '../../../api'
import { materialAssetPath, type ContentService } from '../../../content'
import type { TerrainCompositeMaterial } from '../../../material'
import type { TerrainMacroMaps } from '../TerrainRegionComponent'

export interface BaseMaterialResult {
  /**
   * Default material of the region, may be shared with other regions (loader cache), must not hold region state
   */
  material: TerrainCompositeMaterial
  /**
   * Macro maps of the region, owned by the caller
   */
  macro: TerrainMacroMaps
}

/**
 * Loads the default material and macro maps of a region
 *
 * @param scope - the scope of the region, owns everything that is loaded
 */

export function loadBaseMaterial(
  content: ContentService,
  scheduler: SchedulerSystem,
  scope: ResourceScope,
  data: RegionMaterial,
  done: (result: BaseMaterialResult) => void,
): ScheduledTask {
  let color: Texture
  let normal: Texture
  let gloss: Texture
  let material: TerrainCompositeMaterial

  return scheduler.schedule({
    lane: PriorityLane.Critical,
    load: async (_, signal) => {
      signal.throwIfAborted()

      color = await content.loadTexture(data.colorMap, scope)
      signal.throwIfAborted()

      normal = await content.loadTexture(data.normalMap, scope)
      signal.throwIfAborted()

      gloss = await content.loadTexture(data.specularMap, scope)
      signal.throwIfAborted()

      material = (await content.loader.loadMaterial(materialAssetPath(data.defaultMaterial), {
        baseUrl: content.nwbtFileUrl,
        scope,
        signal: signal,
      })) as TerrainCompositeMaterial
      signal.throwIfAborted()
    },
    finalize: (_, err) => {
      if (err || !material) {
        // shared textures, other users may still hold them
        for (const texture of [color, normal, gloss]) {
          if (texture) {
            scope.drop(texture)
          }
        }
        done(null)
      } else {
        done({ material, macro: { color, normal, gloss } })
      }
      color = normal = gloss = null
      material = null
    },
  })
}
