import { Injector } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { filter, firstValueFrom } from 'rxjs'
import { testAppConfig } from '~/test'
import { BackendService } from '../backend'
import { APP_DB } from '../db'
import { CharacterStore } from './character.store'

describe('Character Store', () => {
  let store: CharacterStore
  let backend: BackendService
  let injector: Injector
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [...testAppConfig.providers],
    })
    await TestBed.inject(APP_DB).dropTables()
    injector = TestBed.inject(Injector)
    store = TestBed.inject(CharacterStore)
    backend = TestBed.inject(BackendService)
  })

  it('creates default character automatically', async () => {
    await firstValueFrom(store.record$.pipe(filter((it) => !!it)))
    expect(store.record()?.id).toBeDefined()
  })

  it('creates default character on sign in', async () => {
    const localRecord = await firstValueFrom(store.record$.pipe(filter((it) => !!it)))
    expect(store.record()?.id).toBeDefined()

    await backend.signIn()
    const remoteRecord = await firstValueFrom(store.record$.pipe(filter((it) => !!it)))
    expect(localRecord).not.toEqual(remoteRecord)

    await backend.signOut()
    const localRecord2 = await firstValueFrom(store.record$.pipe(filter((it) => !!it)))
    expect(localRecord2.id).toEqual(localRecord.id)

    await backend.signIn()
    const remoteRecord2 = await firstValueFrom(store.record$.pipe(filter((it) => !!it)))
    expect(remoteRecord).toEqual(remoteRecord2)
  })
})
