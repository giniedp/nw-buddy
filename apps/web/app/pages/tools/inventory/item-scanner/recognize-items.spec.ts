import { injectNwData } from '~/data'
import { SAMPLES, sampleUrl } from './samples'

import { HttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { NwData } from '@nw-data/db'
import { AffixStatData, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { firstValueFrom } from 'rxjs'
import { TranslateService } from '~/i18n'
import { AppTestingModule } from '~/test'
import { recognizeItemFromImage } from './recognize-item'
import { provideZonelessChangeDetection } from '@angular/core'

describe('item-scanner / recognize', async () => {
  let db: NwData
  let translate: TranslateService
  let http: HttpClient

  let items: MasterItemDefinitions[]
  let affixMap: Map<string, AffixStatData>
  let perksMap: Map<string, PerkData>

  describe('en-us', () => {
    beforeAll(async () => {
      TestBed.configureTestingModule({
        imports: [AppTestingModule],
        providers: [provideZonelessChangeDetection()],
        teardown: { destroyAfterEach: false },
      })
      db = TestBed.runInInjectionContext(() => injectNwData())
      translate = TestBed.inject(TranslateService)
      http = TestBed.inject(HttpClient)

      items = await db.itemsAll()
      affixMap = await db.affixStatsByIdMap()
      perksMap = await db.perksByIdMap()

      await translate.whenLocaleReady('en-us')
    })

    for (const sample of SAMPLES.en) {
      it(sample.file, async () => {
        const image = await firstValueFrom(http.get(sampleUrl(`en/${sample.file}`), { responseType: 'blob' }))
        const results = await recognizeItemFromImage({
          image: image,
          itemClass: sample.itemClass,
          items: items,
          affixMap: affixMap,
          perksMap: perksMap,
          tl8: (key) => translate.get(key),
        })
        const result = results[0].instance
        expect(sample.instance).toEqual(result)
      })
    }
  })
})
