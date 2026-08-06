import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleRutina } from './detalle-rutina';

describe('DetalleRutina', () => {
  let component: DetalleRutina;
  let fixture: ComponentFixture<DetalleRutina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleRutina],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleRutina);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
