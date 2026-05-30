import { TestBed } from '@angular/core/testing';

import { SatisfactionService } from './satisfaction-service';

describe('SatisfactionService', () => {
  let service: SatisfactionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SatisfactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
