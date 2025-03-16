import { Injectable } from '@angular/core'

const imageTypes = ['dds', 'png']
const modelTypes = ['cgf', 'cdf', 'skin']
const jsonTypes = ['dynamicslice', 'meta', 'chunks', 'waterqt', 'timeline']
const textTypes = ['json', 'xml', 'cfg', 'mtl', 'ext']
const textTypeMap = {
  mtl: 'xml',
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
    if (jsonTypes.includes(ext)) {
      stat.textUrl = this.fileUrl(file, 'json')
      stat.textType = 'json'
    }
    if (modelTypes.includes(ext)) {
      stat.modelUrl = this.fileUrl(file, 'glb')
    }
    if (imageTypes.includes(ext)) {
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
