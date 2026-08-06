import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGym } from './admin-gym';

describe('AdminGym', () => {
  let component: AdminGym;
  let fixture: ComponentFixture<AdminGym>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGym],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminGym);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
