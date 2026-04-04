import { TestBed } from '@angular/core/testing';

import { CashClosureService } from './cash-closure.service';

describe('CashClosureService', () => {
  let service: CashClosureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CashClosureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
