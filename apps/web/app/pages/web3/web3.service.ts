import { HttpClient } from '@angular/common/http'
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
const IPFS_GATEWAY = 'w3s.link'

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  public isActive = defer(() => this.storage$).pipe(map((it) => !!it))

  private storage$ = of('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEI0MTk2MDAzZjM1ODUwQjc4OTVBNDg5ODUzMEM2NzlEMDdCQTU3QjkiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NzE4MDQxMDY5NDYsIm5hbWUiOiJudy1idWRkeSJ9.GclwInW6NE81iwzwDQ0jMvvAh6d_UWM_Up8PVTINMc8')
    // this.pref.web3token.observe()
    .pipe(map((it) => (it ? new Web3Storage({ token: it }) : null)))
    .pipe(shareReplay(1))

  public constructor(private pref: AppPreferencesService, private http: HttpClient) {
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
    const request$ = this.http.get<ShareObject<any>>(this.buildIpfsLink(cid, ENTRY_FILE_NAME), {
      responseType: 'json'
    })
    const object = await firstValueFrom(request$)
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

  public buildInternalLink(cid: string) {
    return `${location.origin}/ipfs/${cid}`
  }

  public buildIpfsLink(cid: string, fileName?: string) {
    const url = `https://${cid}.ipfs.${IPFS_GATEWAY}`
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
