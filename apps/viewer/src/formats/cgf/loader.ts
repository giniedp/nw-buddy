import { ContentLoader, type AssetContainer, type AssetLoader, type AssetType, type LoadContext } from '@gglib/content'
import { Geometry, ResourceOwnership, type Ownable } from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import type { NodeData } from '@gglib/model'
import { buildCgfGeometryOptions, type CgfGeometryOptions, type CgfSkinBones } from './geometry'
import { CGF_HEAP_AFTER_PARSE, ENGINE_MAX_LOD_LEVEL } from '../../constants'
import { parseCgf } from './parse'
import type { CgfFile } from './types'

/**
 * The static geometry of a `.cgf` file on the GPU, without materials
 *
 * @remarks
 * Created once per file and shared by all models that use the file, with any material.
 * Owns the buffers and geometries, the models that use it adopt it. Once finalized, the content loader drops it from its cache.
 */
export interface CgfGeometry extends Ownable {
  /**
   * Material reference of the file (asset id or path), the material used when the caller has no override
   */
  mtlRef: string | null
  nodes: NodeData[]
  roots: number[]
  meshes: CgfGeometryMesh[]
  /**
   * Node hierarchies of the inline levels of detail, index 0 is level 1, see {@link CgfGeometryOptions.inlineLods}
   */
  inlineLods: NodeData[][]
  /**
   * Whether the file has levels of detail in sibling files, see {@link CgfGeometryOptions.haveAutoLods}
   */
  haveAutoLods: boolean
  /**
   * See {@link CgfGeometryOptions.siblingLods}
   */
  siblingLods: number | null
  /**
   * Geometric mean of the triangle areas of all rendered meshes
   */
  geometricMeanFaceArea: number
  /**
   * See {@link CgfGeometryOptions.skinBones}
   */
  skinBones: CgfSkinBones | null
}

export interface CgfGeometryMesh {
  name: string
  boundingBox: BoundingBox
  /**
   * One geometry per subset
   */
  geometries: Geometry[]
  /**
   * Material index per geometry, into the material collection of the `.mtl` file
   */
  materialIds: number[]
}

/**
 * Asset type of {@link CgfGeometry}, loaded from `.cgf` urls
 */
export const CgfGeometryAssetType = 'nw-cgf-geometry' as AssetType<CgfGeometryOptions, CgfGeometry>

/**
 * Registers the `.cgf` loader and the {@link CgfGeometry} creator on a content loader
 */
export function registerCgf(content: ContentLoader) {
  content.registerLoader(CgfLoader)
  content.registerCreator(CgfGeometryAssetType, createCgfGeometry)
}

/**
 * Loads `.cgf` files together with their `.cgfheap`
 */
export class CgfLoader implements AssetLoader {
  // `.skin` is the same chunk file format
  public static extensions = ['.cgf', '.skin']
  public static mimeTypes: string[] = []
  public static create = () => new CgfLoader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(CgfLoader)
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const fetchHeap = () =>
      context.content
        .fetch(heapUrl(url), { responseType: 'arraybuffer', signal: context.signal })
        .then((res) => res.body)
        // the old format has no heap file (404), its vertex data is inline
        .catch(() => null)

    // level of detail siblings are probed and may not exist, their heap is only requested when the file exists
    if (CGF_HEAP_AFTER_PARSE || isSiblingLodUrl(url)) {
      // one more round trip, but no heap request for files with inline vertex data
      const res = await context.content.fetch(url, { responseType: 'arraybuffer', signal: context.signal })
      const cgf = parseCgf(res.body)
      const heap = cgf.dataRefs.size ? await fetchHeap() : null
      return new CgfContainer(url, cgf, heap, siblingLodCount(res.headers))
    }
    const [res, heap] = await Promise.all([
      context.content.fetch(url, { responseType: 'arraybuffer', signal: context.signal }),
      fetchHeap(),
    ])
    return new CgfContainer(url, parseCgf(res.body), heap, siblingLodCount(res.headers))
  }
}

/**
 * The highest sibling level of detail of a `.cgf`: the levels the server reports, else (without the report) up to the
 * engine maximum, probed until one is missing. 0 when the file has no sibling levels.
 */
export function siblingLodLevels(geometry: Pick<CgfGeometry, 'haveAutoLods' | 'siblingLods'>): number {
  if (!geometry.haveAutoLods) {
    return 0
  }
  return Math.min(geometry.siblingLods ?? ENGINE_MAX_LOD_LEVEL, ENGINE_MAX_LOD_LEVEL)
}

/**
 * The level of detail siblings the server reports for a `.cgf` (nwbt `X-Lod-Count`), null without the header
 */
export function siblingLodCount(headers: Headers | null | undefined): number | null {
  const value = headers?.get('X-Lod-Count')
  if (value == null || value === '') {
    return null
  }
  const count = Number(value)
  return Number.isInteger(count) && count >= 0 ? count : null
}

function isSiblingLodUrl(url: string) {
  return /_lod\d+\.cgf(\?|$)/i.test(url)
}

function heapUrl(url: string) {
  const query = url.indexOf('?')
  return query < 0 ? url + 'heap' : url.slice(0, query) + 'heap' + url.slice(query)
}

export class CgfContainer implements AssetContainer {
  public readonly url: string
  private data: { cgf: CgfFile; heap: ArrayBuffer | null } | null
  private readonly siblingLods: number | null

  public constructor(url: string, cgf: CgfFile, heap: ArrayBuffer | null, siblingLods: number | null = null) {
    this.url = url
    this.data = { cgf, heap }
    this.siblingLods = siblingLods
  }

  public count(asset: AssetType<any, any>): number {
    return asset === CgfGeometryAssetType ? 1 : 0
  }

  public async load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public async load(asset: AssetType<any, any>, index: number, context: LoadContext): Promise<any> {
    if (asset !== CgfGeometryAssetType || index !== 0) {
      throw new Error(`Asset ${asset}#${index} not supported by this container: ${this.url}`)
    }
    if (!this.data) {
      throw new Error(`Geometry of ${this.url} was already loaded, its file data is released`)
    }
    const { cgf, heap } = this.data
    // the content loader caches the created asset, the raw file data is not needed anymore
    this.data = null
    const options = buildCgfGeometryOptions(cgf, heap ? new Uint8Array(heap) : null, this.url)
    options.siblingLods = this.siblingLods
    return options
  }
}

/**
 * Uploads the buffers of each mesh once and creates a geometry per subset
 *
 * @remarks
 * The geometries of a mesh share its buffers. The result holds the geometries while it is cached,
 * models that are assembled from it hold the result, see ContentService.
 */
export function createCgfGeometry(content: ContentLoader, options: CgfGeometryOptions): CgfGeometry {
  const device = content.device
  const result = { ownership: null } as CgfGeometry & { ownership: ResourceOwnership }
  const ownership = (result.ownership = new ResourceOwnership(result))
  device.scope.adoptUntilClaimed(result)
  return Object.assign(result, {
    mtlRef: options.mtlRef,
    nodes: options.nodes,
    roots: options.roots,
    inlineLods: options.inlineLods,
    haveAutoLods: options.haveAutoLods,
    siblingLods: options.siblingLods,
    geometricMeanFaceArea: options.geometricMeanFaceArea,
    skinBones: options.skinBones,
    meshes: options.meshes.map((mesh) => {
      // skinned meshes read joints and weights from their own buffer, shaders of static meshes get a zero default
      const vertexBuffer = device.createVertexBuffer(
        mesh.boneMapping ? [...mesh.vertexBuffer, mesh.boneMapping] : mesh.vertexBuffer,
      )
      const indexBuffer = device.createIndexBuffer(mesh.indexBuffer)
      const box = BoundingBox.convert(mesh.boundingBox)
      const sphere = BoundingSphere.createFromBox(box)
      return {
        name: mesh.name,
        boundingBox: box,
        materialIds: mesh.subsets.map((s) => s.materialId),
        geometries: mesh.subsets.map((subset) =>
          ownership.adopt(
            new Geometry(device, {
              name: mesh.name,
              vertexBuffer,
              indexBuffer,
              indexOffset: subset.indexOffset,
              indexCount: subset.indexCount,
              vertexCount: mesh.vertexCount,
              // TODO: subsets cover parts of the mesh, the mesh bounds are not tight
              boundingBox: box,
              boundingSphere: sphere,
            }),
          ),
        ),
      }
    }),
  })
}
