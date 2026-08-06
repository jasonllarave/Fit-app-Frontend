import { TestBed } from '@angular/core/testing';

import { Gym } from './gym';

describe('Gym', () => {
  let service: Gym;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Gym);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
