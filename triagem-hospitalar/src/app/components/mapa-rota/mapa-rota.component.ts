import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, MapDirectionsService } from '@angular/google-maps';

export interface DestinoHospital {
  lat?: number;
  lng?: number;
  nome?: string;
  endereco?: string; // alternativa ao lat/lng
  placeId?: string;  // mais preciso
}

export interface Localizacao {
  lat: number;
  lng: number;
}

@Component({
  selector: 'mapa-rota',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './mapa-rota.component.html',
  styleUrls: ['./mapa-rota.component.scss']
})
export class MapaRotaComponent implements OnInit, OnChanges {

  /** Se não for passado, tenta detectar via geolocalização do navegador */
  @Input() origem?: Localizacao | null;

  /** Destino (hospital): {lat,lng} OU {endereco} OU {placeId} */
  @Input({ required: true }) destino!: DestinoHospital;

  /** Modo de viagem (DRIVING, WALKING, BICYCLING, TRANSIT) */
  @Input() modo: google.maps.TravelMode = google.maps.TravelMode.DRIVING;

  /** Tentar detectar a origem automaticamente */
  @Input() autoDetectarOrigem = true;

  /** Emite resumo da rota calculada */
  @Output() rotaCalculada = new EventEmitter<{
    distanciaText: string;
    duracaoText: string;
    distanciaValue: number; // metros
    duracaoValue: number;   // segundos
  }>();

  // Estado do mapa
  zoom = 14;
  center: google.maps.LatLngLiteral = { lat: -15.77972, lng: -47.92972 }; // BR
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    clickableIcons: true,
    fullscreenControl: true,
    mapTypeControl: false,
    streetViewControl: false
  };

  // Direções/rota
  directionsResult?: google.maps.DirectionsResult;
  carregandoRota = false;
  erro?: string;

  // Exibição distância/duração
  distanciaStr?: string;
  duracaoStr?: string;

  // Marcadores (quando não há rota)
  origemMarker = signal<google.maps.LatLngLiteral | null>(null);
  destinoMarker = signal<google.maps.LatLngLiteral | null>(null);

  // Opções do marcador de origem (expostas ao template)
  origemMarkerOptions: google.maps.MarkerOptions = { title: 'Minha localização' };

  constructor(private directions: MapDirectionsService) {}

  ngOnInit(): void {
    // Se veio destino por coordenadas, já centraliza
    const dLat = this.destino?.lat;
    const dLng = this.destino?.lng;
    if (typeof dLat === 'number' && typeof dLng === 'number') {
      this.destinoMarker.set({ lat: dLat, lng: dLng });
      this.center = { lat: dLat, lng: dLng };
    }

    // Configura ícone do marcador de origem (sem usar "google" no template)
    this.configurarIconeOrigem();

    // Detecta origem (se configurado) e calcula rota
    if (!this.origem && this.autoDetectarOrigem) {
      this.detectarOrigem().finally(() => this.calcularRota());
    } else {
      this.calcularRota();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['origem'] || changes['destino'] || changes['modo']) {
      this.calcularRota();
    }
  }

  /** Permite reprocessar rota sob demanda */
  public recalcularRota(): void {
    this.calcularRota();
  }

  /** Pede geolocalização ao navegador e seta como origem */
  private async detectarOrigem(): Promise<void> {
    if (!navigator.geolocation) return;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.origem = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.origemMarker.set(this.origem);
          if (!this.destinoMarker()) this.center = this.origem!;
          resolve();
        },
        (_err) => resolve(),
        { enableHighAccuracy: true, timeout: 7000 }
      );
    });
  }

  /** Evita "google" no template: seta ícone circular via window.google */
  private configurarIconeOrigem(): void {
    const g = (window as any).google as typeof google | undefined;
    if (g?.maps?.SymbolPath) {
      this.origemMarkerOptions = {
        ...this.origemMarkerOptions,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 6 } as google.maps.Symbol
      };
    }
  }

  /** Constrói origem para Directions */
  private origemParaDirections(): google.maps.LatLngLiteral | string | undefined {
    if (!this.origem) return undefined;
    return { lat: this.origem.lat, lng: this.origem.lng };
    // (poderia ser string endereço, se você preferir)
  }

  /** Constrói destino para Directions */
  private destinoParaDirections():
    | google.maps.LatLngLiteral
    | string
    // eslint-disable-next-line @typescript-eslint/ban-types
    | ({} /* placeId */)
    | undefined {
    if (this.destino?.placeId) {
      // DirectionsRequest aceita objeto { placeId }, o tipo em @types expõe como google.maps.Place.
      // Para não depender do symbol em tempo de build, fazemos um cast seguro:
      return { placeId: this.destino.placeId } as unknown as {};
    }
    if (typeof this.destino?.lat === 'number' && typeof this.destino?.lng === 'number') {
      return { lat: this.destino.lat, lng: this.destino.lng };
    }
    if (this.destino?.endereco) return this.destino.endereco;
    if (this.destino?.nome) return this.destino.nome;
    return undefined;
  }

  /** Calcula/mostra a rota */
  private calcularRota(): void {
    this.erro = undefined;
    this.distanciaStr = undefined;
    this.duracaoStr = undefined;
    this.directionsResult = undefined;

    const origem = this.origemParaDirections();
    const destino = this.destinoParaDirections();

    // Sem destino válido: apenas centraliza no destino (se houver lat/lng)
    if (!destino) {
      const dLat = this.destino?.lat;
      const dLng = this.destino?.lng;
      if (typeof dLat === 'number' && typeof dLng === 'number') {
        this.destinoMarker.set({ lat: dLat, lng: dLng });
        this.center = { lat: dLat, lng: dLng };
      }
      return;
    }

    // Sem origem: sem rota (mostra só o destino)
    if (!origem) {
      const dLat = this.destino?.lat;
      const dLng = this.destino?.lng;
      if (typeof dLat === 'number' && typeof dLng === 'number') {
        this.destinoMarker.set({ lat: dLat, lng: dLng });
        this.center = { lat: dLat, lng: dLng };
      }
      return;
    }

    this.carregandoRota = true;

    const req: google.maps.DirectionsRequest = {
      origin: origem as any,
      destination: destino as any,
      travelMode: this.modo,
      provideRouteAlternatives: false
    };

    this.directions.route(req).subscribe({
      next: (resp) => {
        this.carregandoRota = false;
        // (garante ícone quando script já está carregado)
        this.configurarIconeOrigem();

        if (resp.result) {
          this.directionsResult = resp.result;
          const leg = resp.result.routes?.[0]?.legs?.[0];
          if (leg?.distance && leg?.duration) {
            this.distanciaStr = leg.distance.text;
            this.duracaoStr = leg.duration.text;
            this.rotaCalculada.emit({
              distanciaText: leg.distance.text,
              duracaoText: leg.duration.text,
              distanciaValue: leg.distance.value,
              duracaoValue: leg.duration.value
            });
          }
        } else {
          this.erro = 'Não foi possível traçar a rota.';
        }
      },
      error: () => {
        this.carregandoRota = false;
        this.erro = 'Falha ao comunicar com o Google Directions.';
      }
    });
  }
}
