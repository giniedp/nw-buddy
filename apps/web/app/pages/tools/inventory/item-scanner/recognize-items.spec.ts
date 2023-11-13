import { HttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { firstValueFrom } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { AppTestingModule } from '~/test'
import { recognizeItemFromImage } from './recognize-item'

function sampleUrl(file: string) {
  return `/app/pages/tools/inventory/item-scanner/samples/${file}`
}

fdescribe('item-scanner', () => {
  let db: NwDbService
  let translate: TranslateService
  let http: HttpClient

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppTestingModule],
    })
    db = TestBed.inject(NwDbService)
    translate = TestBed.inject(TranslateService)
    http = TestBed.inject(HttpClient)

    await translate.whenLocaleReady('en-us')
    // to switch locale
    //  translate.use('de-de')
    //  await translate.whenLocaleReady('de-de')
  })

  it('translates', () => {
    expect(translate.get('RarityLevel0_DisplayName')).toBe('Common')
  })

  it('fetches data', async () => {
    const items = await firstValueFrom(db.items)
    expect(items.length).toBeGreaterThan(0)
  })

  it('recognizes items', async () => {
    const result = await recognizeItemFromImage({
      affixMap: await firstValueFrom(db.affixStatsMap),
      items: await firstValueFrom(db.items),
      perksMap: await firstValueFrom(db.perksMap),
      itemClass: ['EquippableRing'],
      tl8: (key) => translate.get(key),
      image: await firstValueFrom(http.get(sampleUrl('named_heart_of_anhurawak.png'), { responseType: 'blob' })),
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].name).toBe('Heart of Anhurawak')
  })
})
