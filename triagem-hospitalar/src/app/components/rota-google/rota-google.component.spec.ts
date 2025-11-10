import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotaGoogleComponent } from './rota-google.component';

describe('RotaGoogleComponent', () => {
  let component: RotaGoogleComponent;
  let fixture: ComponentFixture<RotaGoogleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RotaGoogleComponent]
    });
    fixture = TestBed.createComponent(RotaGoogleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
