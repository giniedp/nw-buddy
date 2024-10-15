import { TestBed } from '@angular/core/testing'
import { firstValueFrom } from 'rxjs'
import { AppTestingModule } from '~/test'
import { Mannequin } from './mannequin'

describe('Mannequin', () => {
  let mannequin: Mannequin
  beforeAll(async () => {
    TestBed.configureTestingModule({
      imports: [AppTestingModule],
      providers: [Mannequin],
    })
    mannequin = TestBed.inject(Mannequin)
    console.log(performance.now())
    //await firstValueFrom(mannequin.dbReady$)
    console.log(performance.now())
  })

  beforeEach(() => {
    mannequin.reset()
  })

  it('Test Mannequin', () => {
    // TODO:
  })
})
