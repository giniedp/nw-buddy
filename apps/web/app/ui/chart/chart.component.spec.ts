import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ChartComponent } from './chart.component'
import { provideZonelessChangeDetection } from '@angular/core'

describe('ChartComponent', () => {
  let component: ChartComponent
  let fixture: ComponentFixture<ChartComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
