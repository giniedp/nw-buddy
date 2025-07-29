import { provideHttpClient, withFetch } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { NwData } from '@nw-data/db'
import { lastValueFrom } from 'rxjs'
import { injectNwData } from '~/data'
import { NwExpressionService } from './nw-expression.service'

describe('nw-expression.service', () => {
  let service: NwExpressionService
  let db: NwData

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(withFetch())],
    })
    service = TestBed.inject(NwExpressionService)
    db = TestBed.runInInjectionContext(injectNwData)
  })

  const locales = [
    'en-us',
    // 'de-de'
  ]
  for (const locale of locales) {
    describe(locale, () => {
      let data: string[]
      beforeEach(async () => {
        // TODO: load translations
        // data = await firstValueFrom(db.data.loadTranslations(locale)).then((it) =>
        //   Object.values(it).filter((it) => it.includes('{[')),
        // )
      })

      xit('solves all expressions', async () => {
        for (const text of data) {
          const solved = await lastValueFrom(
            service.solve({
              text: text,
              charLevel: 60,
              gearScore: 600,
              itemId: null,
              ConsumablePotency: 1,
              perkMultiplier: 1,
            }),
          )
          expect(solved).not.toContain('{[')
          expect(solved).not.toContain('⚠')
          expect(solved).not.toContain('⟳')
        }
      })
    })
  }
})
