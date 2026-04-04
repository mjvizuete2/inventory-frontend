import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashClosuresListComponent } from './cash-closures-list.component';

describe('CashClosuresListComponent', () => {
  let component: CashClosuresListComponent;
  let fixture: ComponentFixture<CashClosuresListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashClosuresListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CashClosuresListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
