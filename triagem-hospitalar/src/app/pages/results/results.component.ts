import { Component, computed, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

/** Modelo base vindo do seu backend/dados */
type HospitalBase = {
  id: number;
  nome: string;
  endereco: string;
  cidade: string;
  uf: string;
  telefone: string;
  especialidades: string[];
  imagem: string;
  distanciaKm: number;
  tempoChegadaMin: number;
  avaliacao: number;
  qtdAvaliacoes?: number;
  emergencia: boolean;
  rotaUrl?: string;
  lat: number;
  lng: number;
};

/** Modelo para a view */
type HospitalView = HospitalBase & { fotoUrl: string };

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {
  constructor(private router: Router, private location: Location) {}

  filtroCtrl = new FormControl<string>('', { nonNullable: true });
  priorizaEmergencia = signal<boolean>(false);

  // ======================= HOSPITAIS ============================
  private readonly _hospitais = signal<HospitalBase[]>([
    {
      id: 1,
      nome: 'Hospital Santa Casa',
      endereco: 'Praça Hónorato Alves, 22 - Centro',
      cidade: 'Montes Claros',
      uf: 'MG',
      telefone: '(38) 3229-2000',
      especialidades: ['Cardiologia', 'Ortopedia', 'UTI Adulto'],
      imagem: './../../assets/images/santacasa.jpg',
      distanciaKm: 2.3,
      tempoChegadaMin: 9,
      avaliacao: 4.4,
      qtdAvaliacoes: 1021,
      emergencia: true,
      rotaUrl: '',
      lat: -16.725182993945676,
      lng: -43.870264036928404
    },
    {
      id: 2,
      nome: 'Hospital Aroldo Tourinho',
      endereco: 'Av. João XXIII, 1207 - Edgar Pereira',
      cidade: 'Montes Claros',
      uf: 'MG',
      telefone: '(38) 2101-4040',
      especialidades: ['Pediatria', 'Ginecologia', 'Neonatologia'],
      imagem: './../../assets/images/aroldo-tourinho.jpg',
      distanciaKm: 5.1,
      tempoChegadaMin: 14,
      avaliacao: 4.4,
      qtdAvaliacoes: 168,
      emergencia: true,
      rotaUrl: '',
      lat: -16.709813,
      lng: -43.865259
    },
    {
      id: 3,
      nome: 'Hospital das Clínicas',
      endereco: 'R. Plínio Ribeiro, 539 - Jardim Brasil',
      cidade: 'Montes Claros',
      uf: 'MG',
      telefone: '+55 38 9853-1413',
      especialidades: ['Neurologia', 'Oncologia', 'Radioterapia'],
      imagem: './../../assets/images/hospital-das-clinicas.jpg',
      distanciaKm: 1.1,
      tempoChegadaMin: 6,
      avaliacao: 4.7,
      qtdAvaliacoes: 302,
      emergencia: false,
      rotaUrl: '',
      lat: -16.696143,
      lng: -43.863448
    },
    {
      id: 4,
      nome: 'Hospital Universitário',
      endereco: 'Av. Cula Mangabeira, 562 - Santo Expedito',
      cidade: 'Montes Claros',
      uf: 'MG',
      telefone: '(38) 3224-8000',
      especialidades: ['Clínica Geral', 'Dermatologia', 'Oftalmologia'],
      imagem: './../../assets/images/hospital-universitario.jpg',
      distanciaKm: 3.8,
      tempoChegadaMin: 12,
      avaliacao: 4.2,
      qtdAvaliacoes: 97,
      emergencia: true,
      rotaUrl: '',
      lat: -16.733636,
      lng: -43.872196
    },
    {
      id: 5,
      nome: 'UPA Chiquinho Guimarães',
      endereco: 'Av. Nossa Sra. de Fátima, 2255 - Conj. Chiquinho Guimarães',
      cidade: 'Montes Claros',
      uf: 'MG',
      telefone: '(38) 2211-4700',
      especialidades: ['Traumatologia', 'Fisioterapia', 'Cirurgia Geral'],
      imagem: './../../assets/images/upa-chiquinho-guimaraes.jpg',
      distanciaKm: 6.4,
      tempoChegadaMin: 18,
      avaliacao: 4.3,
      qtdAvaliacoes: 141,
      emergencia: true,
      rotaUrl: '',
      lat: -16.758442,
      lng: -43.875555
    },
    {
      id: 6,
      nome: 'Hospital Prontosocor',
      endereco: 'Av. Mestra Fininha, 920 - Melo',
      cidade: 'Montes Claros',
      uf: 'MG',
      telefone: '(38) 2101-1960',
      especialidades: ['Psiquiatria', 'Endocrinologia', 'Otorrino'],
      imagem: './../../assets/images/prontosocor.jpg',
      distanciaKm: 0.9,
      tempoChegadaMin: 5,
      avaliacao: 4.1,
      qtdAvaliacoes: 63,
      emergencia: false,
      rotaUrl: '',
      lat: -16.728303,
      lng: -43.873254
    }
  ]);
  // =============================================================

  /** Adiciona fotoUrl para o template */
  private readonly _withFoto = computed<HospitalView[]>(() =>
    this._hospitais().map(h => ({ ...h, fotoUrl: (h as any).fotoUrl ?? h.imagem }))
  );

  /** Filtro de busca */
  private readonly _filtrados = computed<HospitalView[]>(() => {
    const q = (this.filtroCtrl.value || '').trim().toLowerCase();
    const baseList = this._withFoto();
    if (!q) return baseList;

    return baseList.filter(h => {
      const base =
        `${h.nome} ${h.cidade} ${h.uf} ${h.endereco} ${h.especialidades.join(' ')}`.toLowerCase();
      return base.includes(q);
    });
  });

  /** Score de recomendação */
  private score(h: HospitalView): number {
    const wRating = 0.55;
    const wTempo  = 0.25;
    const wDist   = 0.15;
    const wEmerg  = 0.05;

    const ratingNorm = (h.avaliacao ?? 0) / 5;
    const tempoNorm  = 1 / Math.max(1, h.tempoChegadaMin);
    const distNorm   = 1 / Math.max(0.5, h.distanciaKm);
    const tempoScaled = tempoNorm * 10;
    const distScaled  = distNorm * 5;
    const emergBonus  = this.priorizaEmergencia() && h.emergencia ? 1 : 0;

    return (
      wRating * ratingNorm +
      wTempo  * (tempoScaled / 10) +
      wDist   * (distScaled / 5) +
      wEmerg  * emergBonus
    );
  }

  /** Ordenação final */
  private readonly _ordenados = computed<HospitalView[]>(() =>
    [...this._filtrados()].sort((a, b) => this.score(b) - this.score(a))
  );

  get hospitais(): HospitalView[] {
    return this._ordenados();
  }

  get hospitaisFiltrados(): HospitalView[] {
    return this._ordenados();
  }

  /* === Voltar para o formulário (mesmo comportamento do detalhamento) === */
  voltar(): void {
    // Se houver histórico, volta; caso contrário, navega para /triagem
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/triagem']);
    }
  }

  verDetalhes(h: HospitalView) {
    console.log('detalhes do hospital', h.id);
  }

  abrir(h: HospitalView) {
    console.log('abrir hospital', h.id);
  }

  setPriorizarEmergencia(priorizar: boolean) {
    this.priorizaEmergencia.set(priorizar);
  }

  /** =====================================================
   *  GEOLOCALIZAÇÃO: calcula distância e tempo dinamicamente
   *  ===================================================== */
  ngOnInit(): void {
    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latUser = pos.coords.latitude;
        const lngUser = pos.coords.longitude;
        this.atualizarDistancias(latUser, lngUser);
      },
      (err) => console.warn('Erro ao obter localização do usuário:', err),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }

  private atualizarDistancias(latUser: number, lngUser: number): void {
    const hospitaisAtualizados = this._hospitais().map(h => {
      const distanciaKm = this.calcularDistanciaKm(latUser, lngUser, h.lat, h.lng);
      const tempoChegadaMin = this.calcularTempoMinutos(distanciaKm);
      return { ...h, distanciaKm, tempoChegadaMin };
    });
    this._hospitais.set(hospitaisAtualizados);
  }

  private calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  private calcularTempoMinutos(distanciaKm: number): number {
    const velocidadeMediaKmH = 15; // média urbana
    const minutos = (distanciaKm / velocidadeMediaKmH) * 60;
    return Math.max(1, Math.round(minutos));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /** Abre rota no Google Maps */
  abrirRota(h: HospitalView, modo: TravelMode = 'driving') {
    const openWith = (origin: string | null) => {
      const destino = `${toFixed(h.lat)},${toFixed(h.lng)}`;
      const params = new URLSearchParams();
      if (origin) params.set('origin', origin);
      params.set('destination', destino);
      params.set('travelmode', modo);
      const url = `https://www.google.com/maps/dir/?api=1&${params.toString()}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (!('geolocation' in navigator)) {
      openWith(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = `${toFixed(pos.coords.latitude)},${toFixed(pos.coords.longitude)}`;
        openWith(origin);
      },
      () => openWith(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }
}

/* Helpers */
function toFixed(n: number, dec = 6): number {
  return Number(n.toFixed(dec));
}
