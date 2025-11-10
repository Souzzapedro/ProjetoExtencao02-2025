import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaRotaOsmComponent } from './mapa-rota-osm.component';

describe('MapaRotaOsmComponent', () => {
  let component: MapaRotaOsmComponent;
  let fixture: ComponentFixture<MapaRotaOsmComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapaRotaOsmComponent]
    });
    fixture = TestBed.createComponent(MapaRotaOsmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
