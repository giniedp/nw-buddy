import { Injectable } from '@angular/core'

const toImageTypes = ['dds', 'png', 'tif']
const toModelTypes = ['cgf', 'cdf', 'skin']
const toJsonTypes = ['dynamicslice', 'meta', 'chunks', 'waterqt', 'timeline', 'datasheet']
const textTypes = ['json', 'xml', 'cfg', 'mtl', 'ext', 'cdf', 'chrparams', 'animevents', 'bspace', 'comb', 'adb']
const textTypeMap = {
  mtl: 'xml',
  cdf: 'xml',
  chrparams: 'xml',
  animevents: 'xml',
  bspace: 'xml',
  comb: 'xml',
  adb: 'xml',
}

export interface FileStat {
  rawUrl: string

  textUrl?: string
  textType?: string
  modelUrl?: string
  imageUrl?: string
}

@Injectable({ providedIn: 'root' })
export class PakService {
  public fileStats(file: string) {
    if (!file) {
      return null
    }
    const ext = file.split('.').pop()
    const stat: FileStat = {
      rawUrl: this.fileUrl(file),
    }
    if (textTypes.includes(ext)) {
      stat.textUrl = this.fileUrl(file)
      stat.textType = textTypeMap[ext] || ext
    }
    if (toJsonTypes.includes(ext)) {
      stat.textUrl = this.fileUrl(file, 'json')
      stat.textType = 'json'
    }
    if (toModelTypes.includes(ext)) {
      stat.modelUrl = this.fileUrl(file, 'glb')
    }
    if (toImageTypes.includes(ext)) {
      stat.imageUrl = this.fileUrl(file, 'png')
    }
    return stat
  }

  public assetUrl(asset: string) {
    return `http://localhost:8000/${asset}`
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
