import { WwiseLibrary } from '../wwise'
import { globAny, type AudioConfig } from './config'

export type BankState = 'loading' | 'loaded' | 'blocked' | 'failed'

interface BankEntry {
  name: string
  state: BankState
  refs: Set<string>
  bytes: number
  promise: Promise<boolean>
  reason?: string
}

/**
 * Loads `.bnk` files as they are into a {@link WwiseLibrary}. Banks are reference counted by an owner key
 * (e.g. a preload or a trigger), so a bank shared by many emitters is fetched once and released with the last owner.
 *
 * @remarks
 * Gates, in order: skip list, then the size limit (checked from `Content-Length` before the body is read).
 */
export class BankManager {
  public readonly library = new WwiseLibrary()
  private entries = new Map<string, BankEntry>()

  private baseUrl: string
  private getConfig: () => AudioConfig
  private onBlocked: (bank: string, reason: string) => void

  public constructor(baseUrl: string, getConfig: () => AudioConfig, onBlocked: (bank: string, reason: string) => void) {
    this.baseUrl = baseUrl
    this.getConfig = getConfig
    this.onBlocked = onBlocked
  }

  public get loadedCount() {
    let n = 0
    for (const e of this.entries.values()) {
      if (e.state === 'loaded') {
        n++
      }
    }
    return n
  }

  public get loadedBytes() {
    let n = 0
    for (const e of this.entries.values()) {
      if (e.state === 'loaded') {
        n += e.bytes
      }
    }
    return n
  }

  public get pendingCount() {
    let n = 0
    for (const e of this.entries.values()) {
      if (e.state === 'loading') {
        n++
      }
    }
    return n
  }

  public isLoaded(name: string) {
    return this.entries.get(normalize(name))?.state === 'loaded'
  }

  /**
   * Acquires a bank for an owner, resolves to whether the bank is available
   */
  public acquire(name: string, owner: string): Promise<boolean> {
    const key = normalize(name)
    let entry = this.entries.get(key)
    if (!entry) {
      entry = { name: key, state: 'loading', refs: new Set(), bytes: 0, promise: null }
      this.entries.set(key, entry)
      entry.promise = this.load(entry)
    }
    entry.refs.add(owner)
    return entry.promise
  }

  public release(name: string, owner: string) {
    const key = normalize(name)
    const entry = this.entries.get(key)
    if (!entry) {
      return
    }
    entry.refs.delete(owner)
    if (entry.refs.size > 0) {
      return
    }
    // keep blocked and failed entries so they are not retried on every acquire
    if (entry.state === 'loaded') {
      this.library.removeBank(entry.name)
      this.entries.delete(key)
    }
  }

  /**
   * Forgets blocked banks, e.g. after the config changed
   */
  public resetBlocked() {
    for (const [key, entry] of this.entries) {
      if (entry.state === 'blocked' || entry.state === 'failed') {
        this.entries.delete(key)
      }
    }
  }

  private async load(entry: BankEntry): Promise<boolean> {
    const config = this.getConfig()
    const stem = entry.name.replace(/\.bnk$/, '')
    if (globAny(config.banks.skip, stem)) {
      return this.block(entry, 'bank skip list')
    }
    try {
      const res = await fetch(`${this.baseUrl}/files/sounds/wwise/${entry.name}`)
      if (!res.ok) {
        entry.state = 'failed'
        entry.reason = `http ${res.status}`
        return false
      }
      const length = Number(res.headers.get('Content-Length') || 0)
      const limit = config.banks.maxSizeMB * 1024 * 1024
      if (limit > 0 && length > limit) {
        res.body?.cancel()
        return this.block(entry, `size ${(length / 1048576).toFixed(1)} MB > ${config.banks.maxSizeMB} MB`)
      }
      const data = new Uint8Array(await res.arrayBuffer())
      if (entry.state !== 'loading') {
        return false
      }
      this.library.addBank(entry.name, data)
      entry.bytes = data.byteLength
      entry.state = 'loaded'
      return true
    } catch (err) {
      entry.state = 'failed'
      entry.reason = String(err)
      return false
    }
  }

  private block(entry: BankEntry, reason: string) {
    entry.state = 'blocked'
    entry.reason = reason
    this.onBlocked(entry.name, reason)
    return false
  }
}

function normalize(name: string) {
  const lower = name.toLowerCase().replace(/^.*\//, '')
  return lower.endsWith('.bnk') ? lower : lower + '.bnk'
}
