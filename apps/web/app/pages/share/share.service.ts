import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { ThirdwebStorage } from "@thirdweb-dev/storage"
import { AppPreferencesService } from '~/preferences'

export interface ShareObject<T> {
  app?: string
  ref: string
  type: string
  data: T
}

export interface ShareInfo {
  cid: string
  file: string
}

const ENTRY_FILE_NAME = 'nw-buddy.json'
const APPLICATION_NAME = 'nw-buddy'

@Injectable({
  providedIn: 'root',
})
export class ShareService {

  public constructor(private pref: AppPreferencesService, private http: HttpClient) {
    //
  }

  public async shareObject(object: ShareObject<any>): Promise<ShareInfo> {
    const storage = new ThirdwebStorage()
    const fileContent: ShareObject<any> = {
      app: APPLICATION_NAME,
      ...object,
    }
    const file = this.createJsonFile(ENTRY_FILE_NAME, fileContent)
    const [cid, name] = await storage.upload(file).then((uri) => uri.replace(/^ipfs:\/\//, '').split('/') )
    return {
      cid: cid,
      file: name,
    }
  }

  public async readObject(cid: string) {
    const fileUri = `ipfs://${cid}/${ENTRY_FILE_NAME}`
    const storage = new ThirdwebStorage()
    const object = await storage.download(fileUri).then((res) => res?.json())
    if (!this.validateObject(object)) {
      return null
    }
    return object
  }

  public validateObject(object: ShareObject<any>) {
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

  public buildIpfsUrl(cid: string, fileName?: string) {
    //const url = `https://${cid}.ipfs.${IPFS_GATEWAY}`
    const url = `https://gateway.ipfscdn.io/ipfs/${cid}`
    if (!fileName) {
      return url
    }
    return `${url}/${fileName}`
  }

  private createJsonFile(fileName: string, data: object) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    return new File([blob], fileName)
  }
}
