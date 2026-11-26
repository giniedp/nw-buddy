import { lazy, type Component } from 'solid-js'
import type { AssetType, BrowseSlice, FileStat } from '../../../api/browse'
import { codeMode } from './code/CodeMode'
import * as sources from './code/sources'
import type { ViewerApp } from '../../app/ViewerApp'
import type { ContentKind } from '../../../api/files'
import { DetailsView } from './details/DetailsView'
import { HexMode } from './hex/HexMode'
import type { SheetData } from './sheet/sheet'

const isObjectStream = (ctx: ViewContext) => ctx.kind === 'objectstream' || ctx.kind === 'objectstream-xml'

/**
 * What a view knows about the file of its tab
 */
export interface ViewContext {
  app: ViewerApp
  path: string
  stat: FileStat
  /**
   * Undefined until the types are loaded
   */
  type: AssetType | undefined
  /**
   * What the content holds, from its first bytes
   */
  kind: ContentKind
  /**
   * The parsed datasheet of a `.datasheet`, undefined for other files and when it could not be parsed
   */
  sheet?: SheetData
  /**
   * The viewer slices of a `.dynamicslice`, undefined for other files and when it could not be converted
   */
  slice?: BrowseSlice
}

/**
 * The props of a view component. `shown` is true while the view is the visible mode of the active tab.
 */
export interface AssetViewProps {
  ctx: ViewContext
  shown: boolean
}

/**
 * A display mode of a file, e.g. text, table, image, hex
 */
export interface AssetView {
  id: string
  /**
   * The name in the mode bar
   */
  label: string
  title?: string
  applies: (ctx: ViewContext) => boolean
  /**
   * `shown` is true while the view is the visible mode of the active tab. Views stay mounted when hidden, e.g. an
   * engine view gives the canvas up while hidden.
   */
  component: Component<AssetViewProps>
}

/**
 * All display modes. A tab offers the ones that apply in this order and opens the first: the views of
 * the content first, Details and Hex last.
 */
export const ASSET_VIEWS: AssetView[] = [
  {
    id: 'texture',
    label: 'Texture',
    title: 'The texture rendered by the engine: mips, faces, slices and channels',
    applies: (ctx) => /\.dds(\.a)?$/i.test(ctx.path),
    // the engine loads with the first texture shown
    component: lazy(() => import('./texture/TextureMode')),
  },
  {
    id: 'model',
    label: 'Model',
    title: 'The model rendered by the engine, with the orbit camera and its levels of detail',
    applies: (ctx) => /\.(cgf|skin)$/i.test(ctx.path),
    // the engine loads with the first model shown
    component: lazy(() => import('./model/ModelMode')),
  },
  {
    id: 'audio-bank',
    label: 'Audio',
    title: 'The media of the sound bank, embedded and streamed: play them',
    applies: (ctx) => /\.bnk$/i.test(ctx.path),
    // ag-grid loads with the first table
    component: lazy(() => import('./audio/AudioBankMode')),
  },
  {
    id: 'audio-media',
    label: 'Audio',
    title: 'The media file: play it, its format and waveform',
    applies: (ctx) => /\.wem$/i.test(ctx.path),
    component: lazy(() => import('./audio/AudioMediaMode')),
  },
  {
    id: 'character',
    label: 'Character',
    title: 'The skins and cloth of the character with their materials, rendered by the engine (bind pose)',
    applies: (ctx) => /\.cdf$/i.test(ctx.path) && ctx.kind === 'text',
    // the engine loads with the first character shown
    component: lazy(() => import('./character/CharacterMode')),
  },
  {
    id: 'slice',
    label: 'Slice',
    title: 'The slice and the slices it spawns, rendered by the engine',
    // only a slice with models, there is nothing to see in 3D otherwise (user decision)
    applies: (ctx) => (ctx.slice?.meshes ?? 0) > 0,
    component: lazy(() => import('./slice/SliceMode')),
  },
  {
    id: 'material',
    label: 'Material',
    title: 'The sub materials rendered by the engine on a cylinder, a box and a sphere',
    applies: (ctx) => /\.mtl$/i.test(ctx.path) && ctx.kind === 'text',
    component: lazy(() => import('./material/MaterialMode')),
  },
  {
    id: 'particles',
    label: 'Effects',
    title: 'The effects of the particle library, the selected one rendered by the engine',
    applies: (ctx) => /^libs\/particles\/.*\.xml$/i.test(ctx.path) && ctx.kind === 'text',
    component: lazy(() => import('./particles/ParticleMode')),
  },
  {
    id: 'inspect',
    label: 'Inspect',
    title: 'The chunks of the file: fields, links between chunks, byte ranges',
    applies: (ctx) => /\.(cgf|skin|chr|caf)$/i.test(ctx.path),
    // ag-grid loads with the first table
    component: lazy(() => import('./inspect/InspectMode')),
  },
  {
    id: 'strings',
    label: 'Table',
    title: 'The localized strings as a table',
    applies: (ctx) => ctx.kind === 'text' && ctx.path.endsWith('.loc.xml'),
    // ag-grid loads with the first table
    component: lazy(() => import('./loc/LocMode')),
  },
  {
    id: 'groups',
    label: 'Groups',
    title: 'The numbered column groups as rows: one per group and row with a value',
    applies: (ctx) => !!ctx.sheet?.groups,
    component: lazy(() => import('./sheet/SheetGroupsMode')),
  },
  {
    id: 'table',
    label: 'Table',
    title: 'The datasheet as it is',
    applies: (ctx) => !!ctx.sheet,
    component: lazy(() => import('./sheet/SheetTableMode')),
  },
  {
    id: 'sheet-json',
    label: 'JSON',
    title: 'The rows with their values as json',
    applies: (ctx) => !!ctx.sheet,
    component: codeMode(sources.sheetJson),
  },
  {
    id: 'music-sheet-json',
    label: 'JSON',
    title: 'The music sheet as json: difficulty, notes with key, track and time (converted by nwbt)',
    applies: (ctx) => /\.musicsheetc$/i.test(ctx.path),
    component: codeMode(sources.json),
  },
  {
    id: 'text',
    label: 'Text',
    applies: (ctx) => ctx.kind === 'text',
    component: codeMode(sources.text),
  },
  {
    id: 'xml',
    label: 'XML',
    title: 'The object stream as xml',
    applies: isObjectStream,
    component: codeMode(sources.xml),
  },
  {
    id: 'json',
    label: 'JSON',
    title: 'The object stream as json',
    applies: isObjectStream,
    component: codeMode(sources.json),
  },
  {
    id: 'lua',
    label: 'Lua',
    title: 'The compiled script, decompiled',
    applies: (ctx) => ctx.path.endsWith('.luac'),
    component: codeMode(sources.lua),
  },
  {
    id: 'details',
    label: 'Details',
    title: 'What the archive and the catalog know about the file',
    applies: () => true,
    component: DetailsView,
  },
  {
    id: 'hex',
    label: 'Hex',
    title: 'The raw bytes of the file',
    applies: () => true,
    component: HexMode,
  },
]
