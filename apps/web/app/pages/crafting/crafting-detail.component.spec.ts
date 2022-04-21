import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CraftingDetailComponent } from './crafting-detail.component';

describe('CraftingDetailComponent', () => {
  let component: CraftingDetailComponent;
  let fixture: ComponentFixture<CraftingDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CraftingDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CraftingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
