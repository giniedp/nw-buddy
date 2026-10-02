import { HttpClient } from '@angular/common/http'
import { EventEmitter, inject, Injectable } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import {
  nwbtAssetsUrl,
  nwbtFetch,
  nwbtFileListUrl,
  nwbtFileStatUrl,
  nwbtFileUrl,
  ServeAssetIdResult,
  ServeListResult,
  ServeStatResult,
} from '@nw-serve'
import { environment } from 'apps/web/environments'
import { catchError, interval, map, of, startWith, switchMap } from 'rxjs'
import {
  svgCode,
  svgCubes,
  svgEyeSlash,
  svgFileJson,
  svgFileXml,
  svgImage,
  svgLayerPlus,
  svgListTree,
  svgSkillTree,
} from '../../ui/icons/svg'
import { eqCaseInsensitive, rxResourceValue } from '../../utils'
import { AssetRef, MonacoSliceAssetCommand } from './monaco'

const toImageTypes = ['dds', 'png', 'tif', 'heightmap', 'waterqt']
const toModelTypes = ['cgf', 'cdf', 'skin'] //, 'mtl', 'dynamicslice']
export const toLuaTypes = ['luac']
export const objectStreams = [
  'aliasasset',
  'chunks',
  'datasheet',
  'distribution',
  'dynamicslice',
  'dynamicuicanvas',
  'meta',
  'metadata',
  'refreshzoneconfigs',
  'slicedata',
  'timeline',
  'waterqt',

  'bsdb',
  'craftstationdb',
  'crestdb',
  'evnotdb',
  'fishdb',
  'fueldb',
  'gactdb',
  'paperdolldb',
  'pbadb',
  'radb',
  'rankdb',
  'sprd',
  'uidb',
  'aoffdb',
  'equipdb',
  'gmevtdb',
  'gdb',
  'gadb',
  'gds',
  'eyecolordb',
  'facemarkdb',
  'hairstyledb',
  'skintonedb',
  'curveconfiglist',
  'physicsmaterialset',
  'stimulusdurations',

  'collisionfilters',
]
export const textTypeMap = {
  json: 'json',
  xml: 'xml',
  txt: 'txt',
  cfg: 'txt',
  ext: 'txt',
  csv: 'txt',

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

function isDDS(file: string) {
  return file.match(/\.dds((\.\d+)|(\.\d+a)|(\.a))?$/)
}

function fileExt(file: string) {
  if (isDDS(file)) {
    return 'dds'
  }
  const basename = file.split('/').pop()
  const tokens = basename.split('.')
  return tokens.pop()
}

function ddsRootFile(file: string) {
  if (file.match(/\.\d+a$/)) {
    return file.replace(/\.\d+a$/, '.a')
  }
  if (file.match(/\.\d+$/)) {
    return file.replace(/\.\d+$/, '')
  }
  return file
}

export type ViewerType = 'code' | 'img' | 'slice' | '3d-image' | '3d-model' | '3d-slice' | '3d-mtl' | ''
export interface FileResource {
  id: string
  file: string
  resource: string
  viewer: ViewerType
  icon: string
  lang: string
  ext: string
  label: string
}

@Injectable()
export class PakService {
  private http = inject(HttpClient)
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  public searchAsset = new EventEmitter<string>()
  public selectedFileId = toSignal(this.route.queryParams.pipe(map((it) => it['file'])))

  public selectFileId(fileId: string) {
    this.router.navigate(['.'], {
      queryParams: { file: fileId },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    })
  }

  public openFileInNewTab(fileId: string) {
    const path = this.router
      .createUrlTree(['.'], {
        queryParams: { file: fileId },
        queryParamsHandling: 'merge',
        relativeTo: this.route,
      })
      .toString()
    window.open(path, '_blank')
  }

  public isConnected = rxResourceValue({
    defaultValue: false,
    keepPrevious: true,
    stream: () => {
      return interval(5000).pipe(
        startWith(0),
        switchMap(() => {
          return this.http.get(this.nwbtUrl('/health')).pipe(
            map(() => true),
            catchError(() => of(false)),
          )
        }),
      )
    },
  })

  public fileSource(file: string): FileResource[] {
    if (!file) {
      return []
    }

    const ext = fileExt(file)
    const result: FileResource[] = []
    const stat: FileResource = {
      id: null,
      resource: this.nwbtUrl(`files/${file}`),
      file: file,
      viewer: null,
      icon: null,
      lang: null,
      ext: ext,
      label: '',
    }

    if (ext === 'dynamicslice') {
      result.push({
        ...stat,
        resource: stat.resource + '.json',
        viewer: 'slice',
        icon: svgListTree,
        id: 'slice',
      })
      result.push({
        ...stat,
        resource: file + '.glb?no-cache=1',
        viewer: '3d-slice',
        icon: svgCubes,
        id: '3d-slice',
      })
    }
    if (ext === 'mtl') {
      result.push({
        ...stat,
        resource: file + '.glb',
        viewer: '3d-mtl',
        icon: svgCubes,
        id: '3d-mtl',
      })
    }

    if (toImageTypes.includes(ext)) {
      if (ext === 'dds') {
        result.push({
          ...stat,
          resource: ddsRootFile(file),
          viewer: '3d-image',
          icon: svgImage,
          id: '3d-image',
          label: 'Viewer',
        })
      }

      result.push({
        ...stat,
        resource: stat.resource + '.png',
        viewer: 'img',
        icon: svgImage,
        id: 'img',
      })
    }

    if (toModelTypes.includes(ext)) {
      result.push({
        ...stat,
        resource: file + '.glb?no-cache=1',
        viewer: '3d-model',
        icon: svgCubes,
        id: '3d-model',
      })
    }

    if (textTypeMap[ext]) {
      const lang = textTypeMap[ext]
      result.push({
        ...stat,
        viewer: 'code',
        icon: lang === 'json' ? svgFileJson : lang === 'xml' ? svgFileXml : svgCode,
        lang: lang,
        id: `code-${lang}`,
        label: lang === 'json' || lang === 'xml' ? '' : lang,
      })
    }
    if (objectStreams.includes(ext)) {
      result.push({
        ...stat,
        resource: stat.resource + '.json',
        viewer: 'code',
        icon: svgFileJson,
        lang: 'json',
        id: `code-json`,
      })
      result.push({
        ...stat,
        resource: stat.resource + '.xml',
        viewer: 'code',
        icon: svgFileXml,
        lang: 'xml',
        id: `code-xml`,
      })
    }
    if (toLuaTypes.includes(ext)) {
      result.push({
        ...stat,
        resource: stat.resource + '.lua',
        viewer: 'code',
        icon: svgCode,
        lang: 'lua',
        id: `code-lua`,
      })
    }

    if (!result.length) {
      result.push({
        ...stat,
        viewer: '',
        icon: svgEyeSlash,
        id: `none`,
      })
    }

    return result
  }

  public nwbtUrl(resource: string) {
    if (!resource.startsWith('/')) {
      resource = '/' + resource
    }
    return `${environment.nwbtUrl}${resource}`
  }

  public fileUrl(file: string, format?: string) {
    if (format) {
      file = `${file}.${format}`
    }
    return this.nwbtUrl(nwbtFileUrl(file))
  }

  public fileListUrl(pattern: string) {
    return this.nwbtUrl(nwbtFileListUrl(pattern).url)
  }

  public fileStatUrl(file: string) {
    return this.nwbtUrl(nwbtFileStatUrl(file).url)
  }

  public fetchFileList(pattern: string) {
    return this.http.get<ServeListResult>(this.fileListUrl(pattern)).pipe(map((result) => result.items))
  }

  public fetchFileStat(pattern: string) {
    return this.http.get<ServeStatResult>(this.fileStatUrl(pattern)).pipe(map((result) => result.items))
  }

  public fetchAsset(uuid: string) {
    return this.http.get<ServeAssetIdResult>(this.nwbtUrl(nwbtAssetsUrl(uuid).url))
  }

  public async handleMonacoAssetCommand({ assetId, assetPath, action }: MonacoSliceAssetCommand) {
    if (!!assetPath && typeof assetPath === 'string') {
      this.handleAssetPathCommand(assetPath, action === 'newTab')
      return
    }

    if (assetId && typeof assetId === 'string') {
      if (action === 'search') {
        this.searchAsset.emit(assetId)
      } else {
        this.handleAssetIdStringCommand(assetId, action === 'newTab')
      }
      return
    }

    if (assetId && typeof assetId === 'object') {
      if (action === 'search') {
        this.searchAsset.emit(assetId.guid)
      } else {
        this.handleAssetIdObjectCommand(assetId, action === 'newTab')
      }
      return
    }
  }

  private async handleAssetPathCommand(assetPath: string, newTab: boolean) {
    let data = await fetchAssetFileInfos(assetPath)
    if (!data.length) {
      data = await fetchAssetFileInfos(assetPath + '*')
    }
    if (!data.length) {
      return
    }
    const file = data[0].asset.file
    if (newTab) {
      this.openFileInNewTab(file)
    } else {
      this.selectFileId(file)
    }
  }

  private async handleAssetIdStringCommand(assetId: string, newTab: boolean) {
    const asset = await fetchAssetInfo(assetId)
    if (newTab) {
      this.openFileInNewTab(asset.file)
    } else {
      this.selectFileId(asset.file)
    }
  }

  private async handleAssetIdObjectCommand(assetId: AssetRef, newTab: boolean) {
    let list = await fetchAssetInfos(assetId.guid)
      .then((it) => it.assets)
      .catch((err) => {
        console.error('Error fetching asset infos for id', assetId, err)
        return []
      })

    // "subid": "00000002-0000-0000-0000-000000000000" => "subid": "2"
    const subId = assetId.subId?.split('-')[0].replace(/^0+/, '') || ''
    if (subId) {
      list = list.filter((it) => String(it.subId) === subId)
    }
    if (assetId.type) {
      list = list.filter((it) => eqCaseInsensitive(it.type, assetId.type))
    }

    if (!list?.length) {
      return
    }

    if (list.length > 1) {
      console.log('Found multiple assets for id', assetId, list)
      return
    }

    if (newTab) {
      this.openFileInNewTab(list[0].file)
    } else {
      this.selectFileId(list[0].file)
    }
  }
}

async function fetchAssetInfo(assetId: string) {
  return fetchAssetInfos(assetId).then((it) => it.asset)
}

async function fetchAssetInfos(assetId: string) {
  return nwbtFetch(environment.nwbtUrl, nwbtAssetsUrl(assetId))
}

async function fetchAssetFileInfos(assetFile: string) {
  return nwbtFetch(environment.nwbtUrl, nwbtFileStatUrl(assetFile)).then((it) => it.items)
}
