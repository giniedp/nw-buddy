import { NwDataService } from '~/data'
import { SAMPLES, sampleUrl } from './samples'

import { HttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { Affixstats, ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { firstValueFrom } from 'rxjs'
import { TranslateService } from '~/i18n'
import { AppTestingModule } from '~/test'
import { recognizeItemFromImage } from './recognize-item'

describe('item-scanner / recognize', async () => {
  let db: NwDataService
  let translate: TranslateService
  let http: HttpClient

  let items: ItemDefinitionMaster[]
  let affixMap: Map<string, Affixstats>
  let perksMap: Map<string, Perks>

  describe('en-us', () => {
    beforeAll(async () => {
      TestBed.configureTestingModule({
        imports: [AppTestingModule],
        teardown: { destroyAfterEach: false },
      })
      db = TestBed.inject(NwDataService)
      translate = TestBed.inject(TranslateService)
      http = TestBed.inject(HttpClient)

      items = await firstValueFrom(db.items)
      affixMap = await firstValueFrom(db.affixStatsMap)
      perksMap = await firstValueFrom(db.perksMap)

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
