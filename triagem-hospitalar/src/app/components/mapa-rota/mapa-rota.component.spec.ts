import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaRotaComponent } from './mapa-rota.component';

describe('MapaRotaComponent', () => {
  let component: MapaRotaComponent;
  let fixture: ComponentFixture<MapaRotaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapaRotaComponent]
    });
    fixture = TestBed.createComponent(MapaRotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
