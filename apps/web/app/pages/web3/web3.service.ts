import { Injectable } from '@angular/core'
import { defer, firstValueFrom, map, of, shareReplay } from 'rxjs'
import { Web3Storage } from 'web3.storage'
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
export class Web3Service {
  public isActive = defer(() => this.storage$).pipe(map((it) => !!it))

  private storage$ = of('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')// this.pref.web3token.observe()
    .pipe(map((it) => (it ? new Web3Storage({ token: it }) : null)))
    .pipe(shareReplay(1))

  public constructor(private pref: AppPreferencesService) {
    //
  }

  public async shareObject(object: ShareObject<any>): Promise<ShareInfo> {
    const storage = await firstValueFrom(this.storage$)
    if (!storage) {
      return null
    }
    const name = [APPLICATION_NAME, object.type, object.ref].filter((it) => !!it).join('-')
    const fileName = ENTRY_FILE_NAME
    const fileContent: ShareObject<any> = {
      app: APPLICATION_NAME,
      ...object,
    }
    const file = this.createJsonFile(fileName, fileContent)
    return {
      cid: await storage.put([file], {
        name: name,
      }),
      file: fileName,
    }
  }

  public async readObject(cid: string) {
    const storage = await firstValueFrom(this.storage$)
    if (!storage) {
      return null
    }
    const result = await storage.get(cid)
    const files = await result.files()
    const file = files.find((it) => it.name === ENTRY_FILE_NAME)
    if (!file) {
      return null
    }
    const text = await file.text()
    const object = JSON.parse(text) as ShareObject<any>
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

  public buildLink(info: ShareInfo) {
    const gateway = this.pref.web3gateway.get() || 'dweb.link'
    return {
      gatewayUrl: `https://${info.cid}.ipfs.${gateway}/${info.file}`,
      appUrl: `${location.origin}/ipfs/${info.cid}`,
    }
  }

  private createJsonFile(fileName: string, data: object) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    return new File([blob], fileName)
  }
}
