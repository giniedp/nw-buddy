import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ItemClass } from '@nw-data/generated'
import { NwDataService, NwDbService } from '~/nw'
import { TestBed } from '@angular/core/testing'
import { lastValueFrom } from 'rxjs'
import { recognizeItemFromImage } from './recognize-item'

const sampleItems = [
  {
    image: './samples/legendary_forgotten_gloves.png',
    itemClass: 'Armor',
  },
  {
    image: './samples/legendary_season2_leggings.png',
    itemClass: 'Armor',
  },
]

describe('item-scanner', () => {
  let db: NwDbService

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NwDbService, NwDataService],
    })

    db = TestBed.inject(NwDbService)
  })

  it(`should recognize item from image`, async () => {
    console.log('test')
    try {
      const perksMap = await lastValueFrom(db.perksMap)
      console.log(perksMap)
    } catch (error) {
      console.log('Error fetching perksMap:', error)
    }

    //         const result = await recognizeItemFromImage({
    //           image: item.image,
    //           itemClass: [item.itemClass as ItemClass],
    //           items: items,
    //           affixMap: affixMap,
    //           perksMap: perksMap,
    //           tl8: (key) => 'Mocked Translation',
    //         })
  }, 25000)
})
