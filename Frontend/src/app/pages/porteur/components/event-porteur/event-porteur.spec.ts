import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventPorteur } from './event-porteur';

describe('EventPorteur', () => {
  let component: EventPorteur;
  let fixture: ComponentFixture<EventPorteur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventPorteur],
    }).compileComponents();

    fixture = TestBed.createComponent(EventPorteur);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
