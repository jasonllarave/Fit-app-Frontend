import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rutinas } from './rutinas';

describe('Rutinas', () => {
  let component: Rutinas;
  let fixture: ComponentFixture<Rutinas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rutinas],
    }).compileComponents();

    fixture = TestBed.createComponent(Rutinas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
