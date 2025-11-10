import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Leaflet
import * as L from 'leaflet';

// ❗ Plugin side-effect (não exporta tipos). Evita erro TS usando ts-ignore.
 // @ts-ignore: plugin sem tipos, apenas adiciona L.Routing
import 'leaflet-routing-machine';

export interface DestinoHospitalOSM {
  lat?: number;
  lng?: number;
  nome?: string;
  endereco?: string; // geocodifica via Nominatim (dev/uso leve)
}

export interface LocalizacaoOSM {
  lat: number;
  lng: number;
}

@Component({
  selector: 'mapa-rota-osm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-rota-osm.component.html',
  styleUrls: ['./mapa-rota-osm.component.scss']
})
export class MapaRotaOsmComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @Input() origem?: LocalizacaoOSM | null;
  @Input({ required: true }) destino!: DestinoHospitalOSM;
  @Input() autoDetectarOrigem = true;

  @Output() rotaCalculada = new EventEmitter<{
    distanciaText: string;
    duracaoText: string;
    distanciaValue: number; // m
    duracaoValue: number;   // s
  }>();

  carregandoRota = false;
  erro?: string;

  distanciaStr?: string;
  duracaoStr?: string;

  private map?: L.Map;
  private routing?: L.Routing.Control;
  private readyView = false;

  private destinoLatLng = signal<L.LatLng | null>(null);

  ngOnInit(): void {
    if (!this.origem && this.autoDetectarOrigem && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { this.origem = { lat: pos.coords.latitude, lng: pos.coords.longitude }; this.tryBuildRoute(); },
        () => this.tryBuildRoute(),
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      this.tryBuildRoute();
    }
  }

  ngAfterViewInit(): void {
    this.readyView = true;

    this.map = L.map('osm-map', { zoomControl: true, attributionControl: true })
      .setView([-15.77972, -47.92972], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.tryBuildRoute();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['origem'] || changes['destino']) this.tryBuildRoute(true);
  }

  ngOnDestroy(): void {
    this.routing?.remove();
    this.map?.remove();
  }

  private async tryBuildRoute(force = false): Promise<void> {
    if (!this.readyView || !this.map) return;

    if (!this.destinoLatLng() && this.destino) {
      if (isFinite(this.destino?.lat as number) && isFinite(this.destino?.lng as number)) {
        this.destinoLatLng.set(L.latLng(this.destino.lat!, this.destino.lng!));
      } else if (this.destino.endereco) {
        const ll = await this.geocodificarEndereco(this.destino.endereco);
        if (ll) this.destinoLatLng.set(ll);
      }
    }

    const from = this.origem ? L.latLng(this.origem.lat, this.origem.lng) : null;
    const to = this.destinoLatLng();

    if (!from && to) {
      this.map.setView(to, 14);
      if (this.routing) { this.routing.remove(); this.routing = undefined; }
      L.marker(to, { icon: this.iconDestino(), title: this.destino?.nome || 'Destino (Hospital)' }).addTo(this.map);
      return;
    }

    if (!from || !to) return;

    if (force && this.routing) { this.routing.remove(); this.routing = undefined; }

    this.carregandoRota = true;
    this.erro = undefined;
    this.distanciaStr = undefined;
    this.duracaoStr = undefined;

    this.routing = L.Routing.control({
      waypoints: [from, to],
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      routeWhileDragging: false,
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
      lineOptions: { styles: [{ color: '#0a84ff', weight: 6, opacity: 0.9 }] },
      createMarker: (i: any, wp: any, _n: any) => L.marker(wp.latLng, {
        icon: i === 0 ? this.iconOrigem() : this.iconDestino(),
        title: i === 0 ? 'Minha localização' : (this.destino?.nome || 'Destino (Hospital)')
      })
    })
      .on('routesfound', (e: any) => {
        this.carregandoRota = false;
        const r = e.routes?.[0];
        if (r?.summary) {
          const dist = r.summary.totalDistance;
          const time = r.summary.totalTime;
          this.distanciaStr = this.fmtDist(dist);
          this.duracaoStr = this.fmtTime(time);
          this.rotaCalculada.emit({
            distanciaText: this.distanciaStr!,
            duracaoText: this.duracaoStr!,
            distanciaValue: dist,
            duracaoValue: time
          });
        }
      })
      .on('routingerror', () => {
        this.carregandoRota = false;
        this.erro = 'Não foi possível traçar a rota (OSRM).';
      })
      .addTo(this.map);
  }

  private async geocodificarEndereco(endereco: string): Promise<L.LatLng | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(endereco)}`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (!Array.isArray(data) || !data[0]) return null;
      const { lat, lon } = data[0];
      return L.latLng(parseFloat(lat), parseFloat(lon));
    } catch {
      return null;
    }
  }

  private fmtDist(m: number): string {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  }

  private fmtTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
  }

  private iconOrigem(): L.DivIcon {
    return L.divIcon({ className: 'marker-origin', iconSize: [16, 16], iconAnchor: [8, 8] });
  }

  private iconDestino(): L.DivIcon {
    return L.divIcon({ className: 'marker-destino', iconSize: [18, 18], iconAnchor: [9, 9] });
  }
}
