import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltrosSidebar } from './filtros-sidebar';

describe('FiltrosSidebar', () => {
  let component: FiltrosSidebar;
  let fixture: ComponentFixture<FiltrosSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltrosSidebar],
    }).compileComponents();

    fixture = TestBed.createComponent(FiltrosSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
