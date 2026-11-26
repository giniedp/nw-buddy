import { Config } from './Config'
import { boolean, choice, defineConfig } from './properties'

/**
 * Options of the asset export (downloads from the pak browser and the viewer), sent as nwbt query parameters. The
 * export dialog shows only the options of the file's type (`exportOptionNames`).
 */
export const exportConfigSchema = defineConfig({
  textures: choice({
    description:
      'Textures of exported models. png: converted, shows in every glTF viewer. dds: the original DDS files, for Blender (other glTF viewers do not show them).',
    editable: true,
    options: ['png', 'dds'],
    default: 'png',
    group: 'Export',
  }),
  textureSize: choice({
    description: 'Maximum size of exported textures (png, embedded glTF textures). full keeps the original size.',
    editable: true,
    options: ['512', '1024', '2048', '4096', 'full'],
    default: 'full',
    group: 'Export',
  }),
  yUp: boolean({
    description: 'Converts models from the game (Z up) to the glTF convention (Y up).',
    editable: true,
    default: true,
    group: 'Export',
  }),
  blenderSpecular: boolean({
    description:
      'Writes the specular color as ior 1.5 with a scaled specular color (the same reflectance) instead of ior 0. Blender renders ior 0 as a mirror without the base color. Other glTF viewers show both the same.',
    editable: true,
    default: true,
    group: 'Export',
  }),
  quantize: boolean({
    description: 'Smaller models: normals and tangents as 16 bit (KHR_mesh_quantization, not every tool reads it).',
    editable: true,
    default: false,
    group: 'Export',
  }),
  allLods: boolean({
    description: 'Adds the LOD models (_lodN files) to a model export.',
    editable: true,
    default: false,
    group: 'Export',
  }),
  keepNoDraw: boolean({
    description: 'Keeps the parts with NoDraw materials (collision and helper geometry the game does not draw).',
    editable: true,
    default: false,
    group: 'Export',
  }),
})

/**
 * The export options. Every change is saved for the browser session (sessionStorage), there are no save or reset
 * actions. Used without the engine (the pak browser runs without it), so it is a module singleton instead of an
 * engine service.
 */
export class ExportConfig extends Config<typeof exportConfigSchema> {
  public constructor() {
    super(exportConfigSchema, { storageKey: 'nw-viewer.export', storage: getSessionStorage() })
    this.load()
    for (const name of this.names) {
      this.onChange(name, () => this.save())
    }
  }
}

function getSessionStorage(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null
  } catch {
    // storage access can throw, e.g. with blocked site data
    return null
  }
}

let instance: ExportConfig | null = null

/**
 * The export options of this page
 */
export function exportConfig(): ExportConfig {
  instance ??= new ExportConfig()
  return instance
}
