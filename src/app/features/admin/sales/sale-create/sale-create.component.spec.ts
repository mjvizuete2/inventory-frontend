import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { SaleCreateComponent } from './sale-create.component';

describe('SaleCreateComponent', () => {
  let component: SaleCreateComponent;
  let fixture: ComponentFixture<SaleCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleCreateComponent],
      providers: [provideNoopAnimations(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaleCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
