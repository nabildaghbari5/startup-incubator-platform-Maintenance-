import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Avancement } from './avancement';

describe('Avancement', () => {
  let component: Avancement;
  let fixture: ComponentFixture<Avancement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Avancement],
    }).compileComponents();

    fixture = TestBed.createComponent(Avancement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
