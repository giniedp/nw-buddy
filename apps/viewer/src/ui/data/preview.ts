/**
 * What of a row can be shown in 3D. Found by the columns of the row, never by table or file names (older game
 * versions work the same):
 *
 * - appearance columns: `Skin1` + `Material1` (armor, with the cloth of `AppearanceCDF`), `ShortsleeveChestSkin`,
 *   `SkinOverride1/2` + `MaterialOverride1/2` (weapons, accessories), `MeshOverride`; the row's blend masks apply
 * - `Mesh` + `Material` (mounts: the material is the fallback of the character's attachments)
 * - `PrefabPath` without extension: `slices/<path>.dynamicslice` (housing items)
 * - any other cell that is a model (`.cgf`, `.skin`, `.cdf`) or a slice, with a companion material column
 * - a reference to a row with a preview (an item's `ArmorAppearanceM`), one link deep
 */
import type { NwbtClient, SheetColumn } from '../../api/browse'
import type { PreviewPart } from '../../game/level/LevelSystem'
import { appearanceParams, isAppearanceRow, type MaterialParams } from '../../material/appearance'
import { cellItems, columnOf, familyText, namedText, rowKey, type Datasheets, type FamilyRows } from './families'
import { assetPath, type AssetFinder } from './assets'

/**
 * One thing to show of a row
 */
export interface RowPreviewOption {
  /**
   * Names the option in the bar, e.g. `Skin1` or `ArmorAppearanceM · Skin1`
   */
  label: string
  /**
   * Identifies the content, the engine keeps it (and the camera) when the same key is shown again
   */
  key: string
  parts?: PreviewPart[]
  /**
   * A `.dynamicslice` to show instead of parts
   */
  slice?: string
  /**
   * The blend masks of an appearance row, null without
   */
  params: MaterialParams | null
  /**
   * The row the models are from, e.g. `ArmorAppearanceDefinitions: Leather_ChestM`
   */
  source: string
}

const MODEL = /\.(cgf|skin|cdf)$/i
const SLICE = /\.(dynamicslice|slice)$/i

/**
 * Columns of the appearance recipes: a mesh and its material
 */
const APPEARANCE_PARTS: Array<{ label: string; parts: Array<[mesh: string, material: string]> }> = [
  { label: 'Skin1', parts: [['Skin1', 'Material1']] },
  { label: 'Short sleeves', parts: [['ShortsleeveChestSkin', 'Material1']] },
  { label: 'Left hand only', parts: [['LeftHandOnlySkin', 'Material1']] },
  { label: 'Right hand only', parts: [['RightHandOnlySkin', 'Material1']] },
  {
    label: 'Skin overrides',
    parts: [
      ['SkinOverride1', 'MaterialOverride1'],
      ['SkinOverride2', 'MaterialOverride2'],
    ],
  },
  // a .cdf with the materials of its attachments, or a .cgf with its own (nwbt collect_appearances_weapons)
  { label: 'MeshOverride', parts: [['MeshOverride', '']] },
  { label: 'Mesh', parts: [['Mesh', 'Material']] },
]

/**
 * Whether a family may have previews by its columns: cheap, before its rows are loaded
 */
function familyMayPreview(columns: readonly SheetColumn[]) {
  return columns.some(
    (column) =>
      (column.kind === 'asset' && column.exts?.some((ext) => MODEL.test(`.${ext}`) || SLICE.test(`.${ext}`))) ||
      /^prefabpath$/i.test(column.name),
  )
}

/**
 * The 3D previews of datasheet rows
 */
export class RowPreviews {
  private readonly nwbt: NwbtClient
  private readonly datasheets: Datasheets
  private readonly assets: AssetFinder
  private readonly sliceMeshes = new Map<string, Promise<boolean>>()

  public constructor(nwbt: NwbtClient, datasheets: Datasheets, assets: AssetFinder) {
    this.nwbt = nwbt
    this.datasheets = datasheets
    this.assets = assets
  }

  /**
   * The previews of a row: its own models first, then those of the rows it references
   */
  public async rowPreviews(rows: FamilyRows, row: number): Promise<RowPreviewOption[]> {
    const own = await this.directPreviews(rows, row)
    const linked: RowPreviewOption[] = []
    const from = { family: rows.family.name, key: rowKey(rows, row) }
    for (const [c, column] of rows.family.columns.entries()) {
      if (column.kind !== 'ref') {
        continue
      }
      const text = familyText(rows, row, c)
      if (!text) {
        continue
      }
      const schemaTargets = column.refs ?? []
      const targets = await Promise.all(schemaTargets.map((name) => this.datasheets.loadFamilyByName(name)))
      if (!targets.some((it) => it && familyMayPreview(it.family.columns))) {
        continue
      }
      for (const key of cellItems(text)) {
        for (const ref of await this.datasheets.resolveRefs(column, key, from)) {
          const target = targets.find((it) => it?.family.name === ref.family)
          const at = target?.keys.get(ref.key.toLowerCase())
          if (!target || at == null || !familyMayPreview(target.family.columns)) {
            continue
          }
          for (const option of await this.directPreviews(target, at)) {
            linked.push({ ...option, label: `${column.name} · ${option.label}` })
          }
        }
      }
    }
    return [...own, ...linked]
  }

  /**
   * The previews of the row's own cells
   */
  private async directPreviews(rows: FamilyRows, row: number): Promise<RowPreviewOption[]> {
    const text = (column: string) => namedText(rows, row, column)
    const source = `${rows.family.name}: ${rowKey(rows, row)}`
    const appearance = isAppearanceRow(text)
    const params = appearance ? appearanceParams(text) : null
    const used = new Set<string>()
    const result: RowPreviewOption[] = []
    const add = (label: string, parts: PreviewPart[] | null, slice?: string) => {
      if (!parts?.length && !slice) {
        return
      }
      result.push({ label, key: `${source}|${label}`, parts: parts ?? undefined, slice, params, source })
    }

    for (const recipe of APPEARANCE_PARTS) {
      const parts: PreviewPart[] = []
      for (const [meshColumn, materialColumn] of recipe.parts) {
        const mesh = text(meshColumn)
        if (!MODEL.test(mesh)) {
          continue
        }
        used.add(meshColumn.toLowerCase())
        parts.push({ mesh: assetPath(mesh), material: materialPath(text(materialColumn)) })
      }
      // an armor's character holds its cape and skirt as cloth
      const cdf = text('AppearanceCDF')
      if (parts.length && recipe.label === 'Skin1' && MODEL.test(cdf)) {
        used.add('appearancecdf')
        parts.push({ mesh: assetPath(cdf), material: materialPath(text('Material1')), clothOnly: true })
      }
      add(recipe.label, parts)
    }

    // housing items: the prefab is a slice path without folder and extension
    const prefab = text('PrefabPath')
    if (prefab && !/\.[a-z]+$/i.test(prefab)) {
      const slice = await this.assets.find(`slices/${prefab}.dynamicslice`)
      if (slice && (await this.sliceHasMeshes(slice))) {
        add('Prefab', null, slice)
      }
    }

    // any other model or slice cell
    for (const [c, column] of rows.family.columns.entries()) {
      if (column.kind !== 'asset' || used.has(column.name.toLowerCase())) {
        continue
      }
      for (const value of cellItems(familyText(rows, row, c))) {
        if (MODEL.test(value)) {
          add(column.name, [
            { mesh: assetPath(value), material: materialPath(companionMaterial(rows, row, column.name)) },
          ])
        } else if (SLICE.test(value)) {
          const slice = await this.assets.find(value)
          if (slice && (await this.sliceHasMeshes(slice))) {
            add(column.name, null, slice)
          }
        }
      }
    }
    return result
  }

  /**
   * Whether a slice has models: there is nothing to see in 3D otherwise (as the browser's Slice mode)
   */
  private sliceHasMeshes(path: string) {
    let result = this.sliceMeshes.get(path)
    if (!result) {
      result = this.nwbt
        .getSlice(path)
        .then((it) => it.meshes > 0)
        .catch(() => false)
      this.sliceMeshes.set(path, result)
    }
    return result
  }
}

/**
 * The material of a mesh column by naming: `StartMesh` → `StartMat` or `StartMaterial`, `SkinOverride1` →
 * `MaterialOverride1`
 */
function companionMaterial(rows: FamilyRows, row: number, meshColumn: string) {
  const candidates = [
    meshColumn.replace(/mesh/i, 'Mat'),
    meshColumn.replace(/mesh/i, 'Material'),
    meshColumn.replace(/skin/i, 'Material'),
  ].filter((it) => it !== meshColumn)
  for (const name of candidates) {
    if (columnOf(rows.family, name) >= 0) {
      const value = namedText(rows, row, name)
      if (value) {
        return value
      }
    }
  }
  return ''
}

function materialPath(path: string) {
  return /\.mtl$/i.test(path) ? assetPath(path) : ''
}
