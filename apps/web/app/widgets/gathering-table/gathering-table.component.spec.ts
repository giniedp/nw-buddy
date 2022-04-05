import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GatheringTableComponent } from './gathering-table.component';

describe('GatheringTableComponent', () => {
  let component: GatheringTableComponent;
  let fixture: ComponentFixture<GatheringTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GatheringTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GatheringTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
