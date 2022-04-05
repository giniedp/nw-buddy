import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VitalsTableComponent } from './vitals-table.component';

describe('VitalsTableComponent', () => {
  let component: VitalsTableComponent;
  let fixture: ComponentFixture<VitalsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VitalsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VitalsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
