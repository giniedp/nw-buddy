import { TestBed } from '@angular/core/testing'
import { firstValueFrom } from 'rxjs'
import { AppTestingModule } from '~/test'
import { Mannequin } from './mannequin'
import { provideZonelessChangeDetection } from '@angular/core'

describe('Mannequin', () => {
  let mannequin: Mannequin
  beforeAll(async () => {
    TestBed.configureTestingModule({
      imports: [AppTestingModule],
      providers: [Mannequin, provideZonelessChangeDetection()],
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
