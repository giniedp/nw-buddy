import { injectNwData } from '~/data'
import { SAMPLES, sampleUrl } from './samples'

import { HttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { NwData } from '@nw-data/db'
import { firstValueFrom } from 'rxjs'
import { TranslateService } from '~/i18n'
import { AppTestingModule } from '~/test'
import { recognizeItemDetails } from './recognize-item-details'
import { recognizeTextFromImage } from './recognize-text-from-image'
import { provideZonelessChangeDetection } from '@angular/core'

describe('item-scanner / scan', async () => {
  let db: NwData
  let translate: TranslateService
  let http: HttpClient

  describe('en-us', () => {
    beforeAll(async () => {
      TestBed.configureTestingModule({
        imports: [AppTestingModule],
        providers: [provideZonelessChangeDetection()],
        teardown: { destroyAfterEach: false },
      })
      db = TestBed.runInInjectionContext(injectNwData)
      translate = TestBed.inject(TranslateService)
      http = TestBed.inject(HttpClient)

      await translate.whenLocaleReady('en-us')
    })

    for (const sample of SAMPLES.en) {
      it(sample.file, async () => {
        const image = await firstValueFrom(http.get(await sampleUrl(`en/${sample.file}`), { responseType: 'blob' }))
        const lines = await recognizeTextFromImage(image)
        const result = await recognizeItemDetails(lines, (key) => translate.get(key))
        expect(result.name).toContain(sample.scan.name)
        if (sample.scan.type) {
          expect(result.type).toContain(sample.scan.type)
        }
        if (sample.scan.rarity) {
          expect(result.rarity).toContain(sample.scan.rarity)
        }
        if (sample.scan.attributes) {
          expect(result.attributes).toEqual(sample.scan.attributes)
        }
        if (sample.scan.perks) {
          expect(result.perks).toEqual(sample.scan.perks)
        }
        if (sample.scan.gearScore) {
          expect(result.gearScore).toEqual(sample.scan.gearScore)
        }
      })
    }
  })
})
