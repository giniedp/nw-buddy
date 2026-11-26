import { describe, expect, it } from 'vitest'
import { AudioNames } from '../audio/preview/names'
import { NwbtClient } from './browse'
import { dispositionFileName, exportActions, exportOptionNames, type ExportOptions } from './export'

const nwbt = new NwbtClient('')
const context = { nwbt, audioNames: new AudioNames(nwbt) }

const options: ExportOptions = {
  textures: 'png',
  textureSize: '2048',
  yUp: true,
  blenderSpecular: false,
  quantize: false,
  allLods: false,
  keepNoDraw: false,
}
const query = (url: string) => url.slice(url.indexOf('?') + 1)
const groups = (path: string) => exportActions(context, path, options).map((it) => `${it.group}:${it.id}`)

describe('exportActions', () => {
  it('exports a texture as png, downloads the stored and merged dds', () => {
    const actions = exportActions(context, 'objects/x_diff.dds', options)
    expect(actions.map((it) => `${it.group}:${it.id}`)).toEqual([
      'export:png',
      'download:dds-raw',
      'download:dds-merged',
    ])
    expect(actions[0].url).toMatch(/\/files\/objects\/x_diff\.dds\.png\?size=2048&download=1$/)
    expect(actions[0].fileName).toBe('x_diff.png')
    expect(actions[1].url).toMatch(/\/files\/objects\/x_diff\.dds\?merge=false&download=1$/)
  })

  it('names the png of an attached alpha', () => {
    expect(exportActions(context, 'objects/x_ddna.dds.a', options)[0].fileName).toBe('x_ddna_a.png')
  })

  it('exports models with png textures and the options', () => {
    const glb = exportActions(context, 'objects/chair.cgf', {
      ...options,
      quantize: true,
      allLods: true,
      textureSize: 'full',
    })[0]
    expect(glb.url).toContain('/files/objects/chair.cgf.glb?')
    expect(query(glb.url)).toBe('yup&quantize=1&lod=all&textures=embed&download=1')
    expect(glb.fileName).toBe('chair.glb')
  })

  it('exports the specular for Blender as ior 1.5', () => {
    const glb = exportActions(context, 'objects/chair.cgf', { ...options, blenderSpecular: true })[0]
    expect(query(glb.url)).toBe('yup&size=2048&textures=embed&ior=1.5&download=1')
    const mtl = exportActions(context, 'objects/chair.mtl', { ...options, blenderSpecular: true })[0]
    expect(query(mtl.url)).toContain('ior=1.5')
  })

  it('exports a character with the selected animations', () => {
    const plain = exportActions(context, 'objects/hero.cdf', options)[0]
    expect(plain.label).toBe('GLB')
    expect(query(plain.url)).not.toContain('animations')
    const animations = [{ name: 'idle', file: 'animations/hero/idle.caf' }]
    const glb = exportActions(context, 'objects/hero.cdf', options, undefined, animations)[0]
    expect(glb.label).toBe('GLB with 1 animation')
    // posted as a form: a long selection does not fit the url
    expect(query(glb.url)).not.toContain('animations')
    expect(glb.form).toEqual({ animations: JSON.stringify(animations) })
    expect(glb.warning).toBeUndefined()
  })

  it('warns about a character export with many animations', () => {
    const animations = Array.from({ length: 101 }, (_, i) => ({ name: `a${i}`, file: `animations/a${i}.caf` }))
    const glb = exportActions(context, 'objects/hero.cdf', options, undefined, animations)[0]
    expect(glb.warning).toContain('101 animations')
  })

  it('leaves out yup when the model stays Z up', () => {
    const glb = exportActions(context, 'objects/chair.cgf', { ...options, yUp: false })[0]
    expect(query(glb.url)).toBe('size=2048&textures=embed&download=1')
  })

  it('exports glb and glTF zip, downloads the raw zip and the file of models', () => {
    expect(groups('objects/chair.skin')).toEqual(['export:glb', 'export:gltf-zip', 'download:raw-zip', 'download:raw'])
    expect(groups('objects/chair.mtl')).toEqual(['export:glb', 'download:raw'])
    expect(groups('levels/x/region.json')).toEqual(['download:raw'])
  })

  it('exports models with the original DDS textures for Blender', () => {
    const dds = (opts: Partial<ExportOptions>) =>
      exportActions(context, 'objects/chair.cgf', { ...options, textures: 'dds', ...opts }, 'objects/chair_mat.mtl')
    const [glb, zip] = dds({})
    expect(query(glb.url)).toBe('material=objects%2Fchair_mat.mtl&yup&size=2048&textures=dds&download=1')
    expect(zip.url).toContain('/files/objects/chair.cgf.gltf.zip?')
    // normal maps are always RGB with z: no normals parameter
    expect(query(zip.url)).not.toContain('normals')
  })
})

describe('music sheet exports', () => {
  it('exports json, downloads the file', () => {
    const path = 'sharedassets/musicsheets/aeternum_drums_part1_hard.musicsheetc'
    expect(groups(path)).toEqual(['export:json', 'download:raw'])
    const [json] = exportActions(context, path, options)
    expect(json.url).toContain(`/files/${path}.json?download=1`)
    expect(json.fileName).toBe('aeternum_drums_part1_hard.json')
    expect(exportOptionNames(path)).toEqual([])
  })
})

describe('exportOptionNames', () => {
  it('shows only the options that apply', () => {
    expect(exportOptionNames('objects/x_diff.dds')).toEqual(['textureSize'])
    expect(exportOptionNames('objects/x_ddna.dds.a')).toEqual(['textureSize'])
    expect(exportOptionNames('objects/chair.cgf')).toEqual([
      'textures',
      'textureSize',
      'yUp',
      'blenderSpecular',
      'quantize',
      'allLods',
      'keepNoDraw',
    ])
    expect(exportOptionNames('objects/chair.mtl')).toEqual([
      'textures',
      'textureSize',
      'yUp',
      'blenderSpecular',
      'quantize',
      'keepNoDraw',
    ])
    expect(exportOptionNames('project.json')).toEqual([])
  })
})

describe('audio exports', () => {
  it('decodes a media file to WAV in the page, downloads the file', () => {
    expect(groups('sounds/wwise/media/1.wem')).toEqual(['export:wav', 'download:raw'])
    const [wav] = exportActions(context, 'sounds/wwise/media/1.wem', options)
    expect(wav.url).toBeNull()
    expect(wav.create).toBeTypeOf('function')
    expect(wav.fileName).toBe('1.wav')
  })

  it('zips the media of a bank as WAV or as stored, downloads the file', () => {
    expect(groups('sounds/wwise/ambiences.bnk')).toEqual(['export:wav-zip', 'download:wem-zip', 'download:raw'])
    expect(exportActions(context, 'sounds/wwise/ambiences.bnk', options).map((it) => it.fileName)).toEqual([
      'ambiences.wav.zip',
      'ambiences.wem.zip',
      'ambiences.bnk',
    ])
  })

  it('has no export options', () => {
    expect(exportOptionNames('sounds/wwise/ambiences.bnk')).toEqual([])
  })
})

describe('dispositionFileName', () => {
  it('reads plain and quoted names', () => {
    expect(dispositionFileName('attachment; filename=x.glb')).toBe('x.glb')
    expect(dispositionFileName('attachment; filename="x y.glb"')).toBe('x y.glb')
    expect(dispositionFileName(null)).toBeNull()
  })
})
