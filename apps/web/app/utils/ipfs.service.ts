import { Injectable } from '@angular/core'

import { IPFS, create } from 'ipfs-core'
import { IDResult, VersionResult } from 'ipfs-core-types/src/root'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class IpfsService {
  private _ipfsSource = new BehaviorSubject<null | IPFS>(null)
  private _createIPFSNodePromise: Promise<IPFS>

  private get ipfs() {
    const getter = async () => {
      let node = this._ipfsSource.getValue()

      if (node == null) {
        console.log('Waiting node creation...')

        node = (await this._createIPFSNodePromise) as IPFS
        this._ipfsSource.next(node)
      }

      return node
    }

    return getter()
  }

  constructor() {
    console.log('Starting new node...')

    this._createIPFSNodePromise = create()
  }

  /**
   * @description Get the ID information about the current IPFS node
   * @return {Promise<IDResult>}
   */
  async getId(): Promise<IDResult> {
    return this.ipfs.then((it) => it.id())
  }

  /**
   * @description Get the version information about the current IPFS node
   * @return {Promise<VersionResult>}
   */
  async getVersion(): Promise<VersionResult> {
    return this.ipfs.then((it) => it.version())
  }

  /**
   * @description Get the status of the current IPFS node
   * @returns {Promise<boolean>}
   */
  public async getStatus(): Promise<boolean> {
    return this.ipfs.then((it) => it.isOnline())
  }
}
