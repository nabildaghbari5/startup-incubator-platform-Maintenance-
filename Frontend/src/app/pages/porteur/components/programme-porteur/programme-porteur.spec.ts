import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgrammePorteur } from './programme-porteur';

describe('ProgrammePorteur', () => {
  let component: ProgrammePorteur;
  let fixture: ComponentFixture<ProgrammePorteur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgrammePorteur],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgrammePorteur);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
