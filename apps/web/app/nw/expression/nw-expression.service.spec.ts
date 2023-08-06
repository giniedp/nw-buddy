import { HttpClientModule } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { firstValueFrom, lastValueFrom } from 'rxjs'
import { NwDataInterceptor } from '../nw-data.interceptor'
import { NwDbService } from '../nw-db.service'
import { NwExpressionService } from './nw-expression.service'

describe('nw-expression.service', () => {
  let service: NwExpressionService
  let db: NwDbService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [NwDataInterceptor.provide()]
    })
    service = TestBed.inject(NwExpressionService)
    db = TestBed.inject(NwDbService)
  })

  const locales = [
    'en-us',
    // 'de-de'
  ]
  for (const locale of locales) {
    describe(locale, () => {
      let data: string[]
      beforeEach(async () => {
        data = await firstValueFrom(db.data.loadTranslations(locale)).then((it) =>
          Object.values(it).filter((it) => it.includes('{['))
        )
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
              perkMultiplier: 1
            })
          )
          expect(solved).not.toContain('{[')
          expect(solved).not.toContain('⚠')
          expect(solved).not.toContain('⟳')
        }
      })
    })
  }
})
