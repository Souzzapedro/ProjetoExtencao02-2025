import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors
} from '@angular/forms';

type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

@Component({
  selector: 'rota-google',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rota-google.component.html',
  styleUrls: ['./rota-google.component.scss']
})
export class RotaGoogleComponent implements OnInit {

  form!: FormGroup;
  buscandoLocalizacao = signal(false);
  erroGeo = signal<string | null>(null);

  modos: { v: TravelMode; t: string }[] = [
    { v: 'driving',   t: 'Carro' },
    { v: 'walking',   t: 'A pé' },
    { v: 'bicycling', t: 'Bicicleta' },
    { v: 'transit',   t: 'Transporte público' },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      usarMinhaLocalizacao: [true],
      // ORIGEM
      origemLat: [{ value: null, disabled: true }, [this.latValidator]],
      origemLng: [{ value: null, disabled: true }, [this.lngValidator]],
      // DESTINO
      destinoLat: [null, [Validators.required, this.latValidator]],
      destinoLng: [null, [Validators.required, this.lngValidator]],
      // MODO
      modo: ['driving' as TravelMode, Validators.required]
    });

    // Habilita/desabilita os campos de origem conforme o toggle
    this.form.get('usarMinhaLocalizacao')!.valueChanges.subscribe((usar: boolean) => {
      const lat = this.form.get('origemLat')!;
      const lng = this.form.get('origemLng')!;
      if (usar) {
        lat.disable({ emitEvent: false });
        lng.disable({ emitEvent: false });
      } else {
        lat.enable({ emitEvent: false });
        lng.enable({ emitEvent: false });
      }
    });
  }

  // --- Validadores simples para intervalo de coordenadas ---
  private latValidator(ctrl: AbstractControl): ValidationErrors | null {
    const n = toNumber(ctrl.value);
    if (n == null) return null; // deixa "required" cuidar do vazio quando aplicável
    return n < -90 || n > 90 ? { latRange: true } : null;
  }
  private lngValidator(ctrl: AbstractControl): ValidationErrors | null {
    const n = toNumber(ctrl.value);
    if (n == null) return null;
    return n < -180 || n > 180 ? { lngRange: true } : null;
  }

  // Descobre a origem via geolocalização do navegador
  usarLocalizacaoAtual(): void {
    if (!navigator.geolocation) {
      this.erroGeo.set('Seu navegador não suporta geolocalização.');
      return;
    }
    this.buscandoLocalizacao.set(true);
    this.erroGeo.set(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.buscandoLocalizacao.set(false);
        // Liga o toggle e bloqueia os campos de origem
        this.form.patchValue({ usarMinhaLocalizacao: true }, { emitEvent: true });
        // Guarda a origem obtida (só informativo; os campos estão desabilitados)
        this.form.patchValue({
          origemLat: fixDecimals(pos.coords.latitude),
          origemLng: fixDecimals(pos.coords.longitude)
        }, { emitEvent: false });
      },
      (err) => {
        this.buscandoLocalizacao.set(false);
        this.erroGeo.set('Não foi possível obter sua localização.');
        console.warn('Geo error:', err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Monta a URL e abre no Google Maps
  abrirNoGoogleMaps(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usarMinhaLoc = !!this.form.get('usarMinhaLocalizacao')!.value;
    const modo = (this.form.get('modo')!.value || 'driving') as TravelMode;

    // Origem
    let origem: string | null = null;
    if (usarMinhaLoc) {
      // Se o browser permitir, o próprio Google pode usar sua localização se omitir "origin".
      // Mas se já capturamos via geolocalização, melhor mandar.
      const oLat = toNumber(this.form.get('origemLat')!.value);
      const oLng = toNumber(this.form.get('origemLng')!.value);
      if (oLat != null && oLng != null) origem = `${oLat},${oLng}`;
    } else {
      const oLat = toNumber(this.form.get('origemLat')!.value);
      const oLng = toNumber(this.form.get('origemLng')!.value);
      if (oLat != null && oLng != null) origem = `${oLat},${oLng}`;
    }

    // Destino (obrigatório)
    const dLat = toNumber(this.form.get('destinoLat')!.value)!;
    const dLng = toNumber(this.form.get('destinoLng')!.value)!;
    const destino = `${dLat},${dLng}`;

    // URL do Google Maps Directions
    // Docs: https://www.google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=...
    const params = new URLSearchParams();
    if (origem) params.set('origin', origem);
    params.set('destination', destino);
    params.set('travelmode', modo);

    const url = `https://www.google.com/maps/dir/?api=1&${params.toString()}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Utilidade para preencher os campos de origem manualmente com um clique (exemplo)
  limparOrigemManual(): void {
    this.form.patchValue({ origemLat: null, origemLng: null });
  }
}

// Helpers
function toNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.').trim());
  return isFinite(n) ? n : null;
}
function fixDecimals(n: number, dec = 6): number {
  return Number(n.toFixed(dec));
}
