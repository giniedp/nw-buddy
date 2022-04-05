import { ComponentFixture, TestBed } from '@angular/core/testing'

import { XpTableComponent } from './xp-table.component'

describe('XpTableComponent', () => {
  let component: XpTableComponent
  let fixture: ComponentFixture<XpTableComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [XpTableComponent],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(XpTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
