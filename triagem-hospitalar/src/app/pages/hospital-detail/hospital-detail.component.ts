import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, NgIf, NgFor } from '@angular/common';

type HospitalBase = {
  id: number;
  nome: string;
  endereco: string;
  cidade: string;
  uf: string;
  telefone: string;
  especialidades: string[];
  imagem: string;           // imagem principal (fallback)
  imagens?: string[];       // opcional: várias imagens para o carrossel
  distanciaKm: number;
  tempoChegadaMin: number;
  avaliacao: number;
  qtdAvaliacoes?: number;
  emergencia: boolean;
  rotaUrl?: string;
  lat: number;
  lng: number;
};
type HospitalView = HospitalBase & { fotoUrl?: string };
type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

@Component({
  selector: 'app-hospital-detail',
  templateUrl: './hospital-detail.component.html',
  styleUrls: ['./hospital-detail.component.scss']
})
export class HospitalDetailComponent implements OnDestroy {
  hospital?: HospitalView;

  // Carrossel
  imagens: string[] = [];
  slideAtual = 0;
  private timer?: any;

  // Texto de exemplo; pode vir do backend
  descricaoLonga =
    'Hospital de referência regional, com corpo clínico qualificado e atendimento humanizado. ' +
    'Conta com setores de alta complexidade, centro cirúrgico, UTI e pronto atendimento.';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    // 1) tenta pegar o hospital do state (veio da lista)
    const st = (this.router.getCurrentNavigation()?.extras.state || {}) as { hospital?: HospitalView };
    if (st?.hospital) {
      this.setHospital(st.hospital);
      return;
    }

    // 2) fallback: tenta carregar pelo :id (mock local; troque por service/HTTP)
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(id)) {
      const mock = this.mockGetById(id);
      if (mock) this.setHospital(mock);
    }
  }

  private setHospital(h: HospitalView) {
    this.hospital = h;
    // carrega imagens (usa fallback se vier só "imagem")
    const base = (h.imagens?.length ? h.imagens : [h.imagem]).filter(Boolean) as string[];
    this.imagens = Array.from(new Set(base));
    this.startAutoplay();
  }

  // MOCK local – substitua por chamada ao seu service
  private mockGetById(id: number): HospitalView | undefined {
    const placeholder = './../../assets/hospital-placeholder.jpg';
    return {
      id,
      nome: 'Hospital Exemplo',
      endereco: 'Av. Exemplo, 123',
      cidade: 'Montes Claros',
      uf: 'MG',
      telefone: '(38) 0000-0000',
      especialidades: ['Clínica Geral', 'Pediatria', 'Ortopedia'],
      imagem: placeholder,
      imagens: [placeholder, placeholder, placeholder],
      distanciaKm: 2.1,
      tempoChegadaMin: 8,
      avaliacao: 4.5,
      qtdAvaliacoes: 250,
      emergencia: true,
      lat: -16.72,
      lng: -43.87
    };
  }

  voltar() {
    if (history.length > 1) history.back();
    else this.router.navigate(['/resultados']);
  }

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

    if (!('geolocation' in navigator)) return openWith(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => openWith(`${toFixed(pos.coords.latitude)},${toFixed(pos.coords.longitude)}`),
      () => openWith(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Controles do carrossel
  next() { if (this.imagens.length) this.slideAtual = (this.slideAtual + 1) % this.imagens.length; }
  prev() { if (this.imagens.length) this.slideAtual = (this.slideAtual - 1 + this.imagens.length) % this.imagens.length; }
  go(i: number) { if (i >= 0 && i < this.imagens.length) this.slideAtual = i; }

  private startAutoplay() { this.stopAutoplay(); this.timer = setInterval(() => this.next(), 5000); }
  private stopAutoplay() { if (this.timer) { clearInterval(this.timer); this.timer = undefined; } }
  ngOnDestroy(): void { this.stopAutoplay(); }
}

function toFixed(n: number, dec = 6): number { return Number(n.toFixed(dec)); }
