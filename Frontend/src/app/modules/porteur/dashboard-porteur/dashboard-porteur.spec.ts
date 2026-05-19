import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPorteur } from './dashboard-porteur';

describe('DashboardPorteur', () => {
  let component: DashboardPorteur;
  let fixture: ComponentFixture<DashboardPorteur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPorteur],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPorteur);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
