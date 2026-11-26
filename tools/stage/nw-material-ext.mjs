// EXT_nw_material for gltf-transform (nwbt `extensions.ExtNwMaterial`, viewer `material/GltfExtension.ts`): the game
// material of a glTF material. Its textures are graph references, so prune, dedup and re-encoding keep them right.
// Texture infos keep their EXT_nw_tex (the game's map name and texture modifier) as plain json.
import { createRequire } from 'node:module'

const require = createRequire(new URL('../../node_modules/.pnpm/node_modules/', import.meta.url))
const core = require('@gltf-transform/core')
const { RefMap } = require('property-graph')

export const EXT_NW_MATERIAL = 'EXT_nw_material'
// texture fields of the extension: the list `textures` and the single infos
const SINGLE_TEXTURES = ['maskTexture', 'smoothTexture']

export class NwMaterial extends core.ExtensionProperty {
  init() {
    this.extensionName = EXT_NW_MATERIAL
    this.propertyType = 'NwMaterial'
    this.parentTypes = [core.PropertyType.MATERIAL]
  }

  getDefaults() {
    return Object.assign(super.getDefaults(), {
      // the extension json without its texture fields
      data: {},
      // texture slot key ("textures/0", "maskTexture") → texture, its info and the info's EXT_nw_tex json
      textures: new RefMap(),
      textureInfos: new RefMap(),
      textureExtensions: {},
    })
  }

  getData() {
    return this.get('data')
  }

  setData(data) {
    return this.set('data', data)
  }

  listTextureKeys() {
    return this.listRefMapKeys('textures')
  }

  getTexture(key) {
    return this.getRefMap('textures', key)
  }

  getTextureInfo(key) {
    return this.getRefMap('textureInfos', key)
  }

  getTextureExtensions(key) {
    return this.get('textureExtensions')[key]
  }

  /**
   * Removes all textures
   */
  clearTextures() {
    for (const key of this.listTextureKeys()) {
      this.setRefMap('textures', key, null)
      this.setRefMap('textureInfos', key, null)
    }
    this.set('textureExtensions', {})
    return this
  }

  /**
   * Takes the textures (with their infos and EXT_nw_tex) of another game material
   */
  copyTexturesFrom(other) {
    this.clearTextures()
    for (const key of other.listTextureKeys()) {
      const info = this.setTexture(key, other.getTexture(key), other.getTextureExtensions(key))
      info.copy(other.getTextureInfo(key))
    }
    return this
  }

  setTexture(key, texture, textureExtensions) {
    const info = new core.TextureInfo(this.graph, `nwTextureInfo:${key}`)
    this.setRefMap('textures', key, texture)
    this.setRefMap('textureInfos', key, info)
    this.set('textureExtensions', { ...this.get('textureExtensions'), [key]: textureExtensions })
    return info
  }
}

export class NwMaterialExtension extends core.Extension {
  static EXTENSION_NAME = EXT_NW_MATERIAL
  extensionName = EXT_NW_MATERIAL

  createNwMaterial() {
    return new NwMaterial(this.document.getGraph())
  }

  read(context) {
    const materialDefs = context.jsonDoc.json.materials || []
    materialDefs.forEach((def, index) => {
      const ext = def.extensions?.[EXT_NW_MATERIAL]
      if (!ext) {
        return
      }
      const property = this.createNwMaterial()
      const data = { ...ext }
      delete data.textures
      for (const name of SINGLE_TEXTURES) {
        delete data[name]
      }
      property.setData(data)
      const add = (key, infoDef) => {
        const texture = context.textures[infoDef?.index]
        if (!texture) {
          return
        }
        const info = property.setTexture(key, texture, infoDef.extensions ?? null)
        context.setTextureInfo(info, infoDef)
      }
      ;(ext.textures || []).forEach((infoDef, i) => add(`textures/${i}`, infoDef))
      for (const name of SINGLE_TEXTURES) {
        add(name, ext[name])
      }
      context.materials[index].setExtension(EXT_NW_MATERIAL, property)
    })
    return this
  }

  write(context) {
    const json = context.jsonDoc.json
    for (const material of this.document.getRoot().listMaterials()) {
      const property = material.getExtension(EXT_NW_MATERIAL)
      if (!property) {
        continue
      }
      const def = json.materials[context.materialIndexMap.get(material)]
      const ext = JSON.parse(JSON.stringify(property.getData()))
      const textures = []
      for (const key of property.listTextureKeys()) {
        const infoDef = context.createTextureInfoDef(property.getTexture(key), property.getTextureInfo(key))
        const extensions = property.getTextureExtensions(key)
        if (extensions) {
          infoDef.extensions = extensions
        }
        if (key.startsWith('textures/')) {
          textures.push(infoDef)
        } else {
          ext[key] = infoDef
        }
      }
      if (textures.length) {
        ext.textures = textures
      }
      def.extensions = def.extensions || {}
      def.extensions[EXT_NW_MATERIAL] = ext
    }
    return this
  }
}
