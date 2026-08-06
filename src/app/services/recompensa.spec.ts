import { TestBed } from '@angular/core/testing';

import { Recompensa } from './recompensa';

describe('Recompensa', () => {
  let service: Recompensa;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Recompensa);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
