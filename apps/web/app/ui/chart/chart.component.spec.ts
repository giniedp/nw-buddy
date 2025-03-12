import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ChartComponent } from './chart.component'
import { provideExperimentalZonelessChangeDetection } from '@angular/core'

describe('ChartComponent', () => {
  let component: ChartComponent
  let fixture: ComponentFixture<ChartComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartComponent],
      providers: [provideExperimentalZonelessChangeDetection()],
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
