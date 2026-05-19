import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Livrables } from './livrables';

describe('Livrables', () => {
  let component: Livrables;
  let fixture: ComponentFixture<Livrables>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Livrables],
    }).compileComponents();

    fixture = TestBed.createComponent(Livrables);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
