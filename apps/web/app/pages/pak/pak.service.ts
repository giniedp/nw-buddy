import { inject, Injectable } from '@angular/core'
import { environment } from 'apps/web/environments'
import { MonacoService } from '../../ui/code-editor/monaco.service'
import { monaco } from '../../ui/code-editor/monaco-editor'

const toImageTypes = ['dds', 'png', 'tif', 'a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', 'heightmap']
const toModelTypes = ['cgf', 'cdf', 'skin', 'mtl', 'dynamicslice']
const toJsonTypes = [
  'dynamicslice',
  'meta',
  'chunks',
  'waterqt',
  'timeline',
  'datasheet',
  'slicedata',
  'aliasasset',
  'metadata',
  'distribution'
]
const textTypes = [
  'json',
  'xml',
  'txt',
  'cfg',
  'mtl',
  'ext',
  'cdf',
  'chrparams',
  'animevents',
  'bspace',
  'comb',
  'adb',
  'grid',
  'actionlist',
  'entities_xml',
  'worldmat',
  'regionmat',
  'surfacemap'
]
const textTypeMap = {
  mtl: 'xml',
  cdf: 'xml',
  chrparams: 'xml',
  animevents: 'xml',
  bspace: 'xml',
  comb: 'xml',
  adb: 'xml',
  grid: 'xml',
  actionlist: 'xml',
  entities_xml: 'xml',
  worldmat: 'xml',
  regionmat: 'xml',
  surfacemap: 'xml',
}

export interface FileSource {
  baseUrl: string

  path: string
  ext: string
  textPath?: string
  textType?: string
  modelPath?: string
  imagePath?: string
}

@Injectable({ providedIn: 'root' })
export class PakService {
  private monaco = inject(MonacoService)
  public fileSource(file: string) {
    if (!file) {
      return null
    }
    const basename = file.split('/').pop()
    const tokens = basename.split('.')
    let ext = tokens.pop()
    if (ext.match(/^[0-9]+$/)) {
      ext = tokens.pop()
    }
    const stat: FileSource = {
      baseUrl: this.assetUrl('file/'),
      path: file,
      ext: ext,
    }
    if (textTypes.includes(ext)) {
      stat.textPath = file
      stat.textType = textTypeMap[ext] || ext
    }
    if (toJsonTypes.includes(ext)) {
      stat.textPath = `${file}.json`
      stat.textType = 'json'
    }
    if (toModelTypes.includes(ext)) {
      stat.modelPath = `${file}.glb`
    }
    if (toImageTypes.includes(ext)) {
      stat.imagePath = `${file}.png`
    }
    return stat
  }

  public assetUrl(asset: string) {
    return `${environment.nwbtUrl}/${asset}`
  }

  public fileUrl(file: string, format?: string) {
    if (format) {
      file = `${file}.${format}`
    }
    return this.assetUrl(`file/${file}`)
  }

  public listUrl(pattern: string) {
    return this.assetUrl(`list/${pattern}`)
  }

}
