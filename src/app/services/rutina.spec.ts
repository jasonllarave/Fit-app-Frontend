import { TestBed } from '@angular/core/testing';

import { Rutina } from './rutina';

describe('Rutina', () => {
  let service: Rutina;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rutina);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
