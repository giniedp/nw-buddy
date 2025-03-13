import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { ThirdwebStorage } from '@thirdweb-dev/storage'
import { combineLatest, filter, map, of, switchMap } from 'rxjs'
import { ConfirmDialogComponent, ModalService, PromptDialogComponent } from '~/ui/layout'
import { getIpnsRevision, udpateIpnsRevision } from './utils/ipns-revision'

const ENTRY_FILE_NAME = 'nw-buddy.json'
const APPLICATION_NAME = 'nw-buddy'
const KNOWN_GATEWAYS = ['ipfs.io', 'dweb.link', 'w3s.link', 'ipfs.cyou']

export interface UploadOptions<T> {
  /**
   * The object to upload
   */
  content: UploadContent<T>
  /**
   * The private key of an existing ipfn record
   */
  ipnsKey?: string
  /**
   * If set, an ipns revision is cread
   */
  enableIpns?: boolean
}

export interface UploadContent<T> {
  /**
   * Application name (always 'nw-buddy')
   */
  app?: string
  /**
   * Application version (e.g. 1.8.4)
   */
  appVersion?: string
  /**
   * Application specific data reference (or ID)
   */
  ref: string
  /**
   * Application specific data type
   */
  type: string
  /**
   * The actual content
   */
  data: T
}

export interface ShareInfo {
  cid: string
  file: string
  name?: string
  privateKey?: string
}

@Injectable({
  providedIn: 'root',
})
export class ShareService {
  public get knownGateways() {
    return [...KNOWN_GATEWAYS]
  }

  public async importItem(modal: ModalService, router: Router) {
    PromptDialogComponent.open(modal, {
      inputs: {
        title: 'Import',
        body: 'Paste a shared URL or Content ID here',
        value: '' as string,
        placeholder: 'URL or CID',
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        map((input) => {
          if (input.includes('ipfs/')) {
            return input.split('ipfs/')[1]
          }
          return input
        }),
        switchMap((input) => this.resolveCidFromString(input)),
        switchMap((cid) =>
          combineLatest({
            type: this.download({ cid }).then((it) => it?.type),
            cid: of(cid),
          }),
        ),
      )
      .subscribe({
        next: ({ type, cid }) => {
          if (type === 'gearset') {
            router.navigate(['gearsets', 'share', 'ipfs', cid])
          } else if (type === 'skill-build') {
            router.navigate(['skill-trees', 'share', 'ipfs', cid])
          } else {
            ConfirmDialogComponent.open(modal, {
              inputs: {
                title: 'Error',
                body: 'Unknown or invalid CID',
                positive: 'OK',
              },
            })
          }
        },
        error: (err) => {
          ConfirmDialogComponent.open(modal, {
            inputs: {
              title: 'Error',
              body: err.message,
              positive: 'OK',
            },
          })
        },
      })
  }

  public async upload({ content, enableIpns, ipnsKey }: UploadOptions<any>) {
    content = {
      app: APPLICATION_NAME,
      ...content,
    }
    const result = await this.uploadContent({ content })
    if (enableIpns) {
      const { key, name } = await udpateIpnsRevision(ipnsKey, `/ipfs/${result.cid}`)
      result.privateKey = key
      result.name = name.toString()
    }
    return result
  }

  public async download({ name, cid, gateway }: { name?: string; cid?: string; gateway?: string }) {
    if (name && !cid) {
      cid = await this.resolveCidFromName(name)
    }
    if (!cid) {
      throw new Error('Invalid CID')
    }
    let object: any = null
    if (gateway) {
      const fileUrl = this.buildIpfsUrl({
        cid,
        fileName: ENTRY_FILE_NAME,
        gateway,
      })
      object = await fetch(fileUrl).then((res) => res.json())
    } else {
      const fileUri = `ipfs://${cid}/${ENTRY_FILE_NAME}`
      const storage = this.getStorage()
      object = await storage.download(fileUri).then((res) => res?.json())
    }
    if (!isValidSharedObject(object)) {
      return null
    }
    return object
  }

  public async resolveCidFromName(name: string) {
    const revision = await getIpnsRevision(name)
    return revision.value.replace('/ipfs/', '')
  }

  public async resolveCidFromString(input: string): Promise<string> {
    if (input.includes('ipfs/')) {
      return input.split('ipfs/')[1]
    }
    if (input.startsWith('ipfs://')) {
      return input.replace('ipfs://', '').split('/')[0]
    }
    if (input.includes('ipns/')) {
      input = input.split('ipns/')[1]
    } else if (input.startsWith('ipns://')) {
      input = input.replace('ipns://', '')
    }
    // could be a name or a cid
    return getIpnsRevision(input)
      .then((revision) => revision.value.replace('/ipfs/', ''))
      .catch(() => {
        // failed to resolve name, so it must be a cid
        return input
      })
  }

  public buildIpfsUrl({ gateway, cid, fileName }: { gateway?: string; cid: string; fileName?: string }) {
    gateway = gateway || this.knownGateways[0]
    const url = `https://${gateway}/ipfs/${cid}`
    if (!fileName) {
      return url
    }
    return `${url}/${fileName}`
  }

  protected uploadContent({ content }: UploadOptions<any>) {
    return this.uploadToIpfs(content)
  }

  protected async uploadToIpfs(content: UploadContent<any>): Promise<ShareInfo> {
    const storage = this.getStorage()
    const file = createJsonFile(ENTRY_FILE_NAME, content)
    const [cid, name] = await storage.upload(file).then((uri) => uri.replace(/^ipfs:\/\//, '').split('/'))
    return {
      cid: cid,
      file: name,
    }
  }

  protected getStorage() {
    return new ThirdwebStorage({ clientId: '84f9106337126bda075938273ddc972e' })
  }
}

function createJsonFile(fileName: string, data: object) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  return new File([blob], fileName)
}

function validateSharedObject(object: UploadContent<any>) {
  if (!object) {
    return false
  }
  if (!object.type || !object.ref) {
    return false
  }
  if (object.app !== APPLICATION_NAME) {
    return false
  }
  return true
}

function isValidSharedObject(object: any): object is UploadContent<any> {
  return validateSharedObject(object)
}
