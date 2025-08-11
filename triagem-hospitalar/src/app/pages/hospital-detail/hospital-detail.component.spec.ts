import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HospitalDetailComponent } from './hospital-detail.component';

describe('HospitalDetailComponent', () => {
  let component: HospitalDetailComponent;
  let fixture: ComponentFixture<HospitalDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HospitalDetailComponent]
    });
    fixture = TestBed.createComponent(HospitalDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
