import { Component, OnInit /*, ChangeDetectionStrategy, ChangeDetectorRef */ } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  standalone: false,
  // changeDetection: ChangeDetectionStrategy.OnPush, // se você estiver usando, mantenha
})
export class FormComponent implements OnInit {
  form!: FormGroup;
  submitted = false;

  /** Sintomas comuns — já definidos aqui, disponíveis no primeiro paint */
  readonly sintomasComuns: string[] = [
    'Febre', 'Dor de cabeça', 'Tosse', 'Falta de ar', 'Dor no peito',
    'Náusea', 'Vômito', 'Diarreia', 'Dor abdominal', 'Tontura'
  ];

  /** Set para marcação rápida dos chips */
  private readonly sintomasSelecionados = new Set<string>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    // private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      idade: [null, [Validators.required, Validators.min(0), Validators.max(120)]],
      sexo: [null, Validators.required],
      outrosSintomas: [''],
      sintomas: [[]],
      gestante: [false],
      // caso tenha campos de emergência, adicione-os aqui também para evitar form invalid
      dorPeito: [false],
      acidente: [false],
      faltaAr: [false],
      sangramento: [false],
      convulsao: [false],
    });

    // ⚠️ Importante: NÃO reatribuir this.sintomasComuns aqui.
    // Se no futuro você buscar sintomas de uma API, depois de setar chame:
    // this.cdr.markForCheck();
  }

  /** Alterna um sintoma e sincroniza com o form control "sintomas" */
  toggleSintoma(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const val = (input.value || '').trim();
    if (!val) return;

    if (input.checked) this.sintomasSelecionados.add(val);
    else this.sintomasSelecionados.delete(val);

    this.form.get('sintomas')?.setValue(this.sintomasComoArray());
    this.form.get('sintomas')?.markAsDirty();
    // se OnPush e isso vier de evento externo, pode usar:
    // this.cdr.markForCheck();
  }

  /** Conveniência para o template */
  isSintomaSelecionado(s: string): boolean {
    return this.sintomasSelecionados.has(s);
  }

  /** trackBy para performance no *ngFor */
  trackBySintoma = (_: number, s: string) => s;

  /** Array estável a partir do Set */
  private sintomasComoArray(): string[] {
    return Array.from(this.sintomasSelecionados);
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        console.log('Coordenadas obtidas:', lat, lon);
      },
      (err) => {
        console.warn('Erro ao obter localização:', err);
        alert('Não foi possível obter sua localização.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  onSubmit(): void {
    this.submitted = true;

    const payload = {
      ...this.form.value,
      sintomas: this.sintomasComoArray(),
    };

    const idadeValida = this.form.get('idade')?.valid;
    const sexoValido = this.form.get('sexo')?.valid;
    const temSintoma =
      (payload.sintomas && payload.sintomas.length > 0) ||
      !!payload.outrosSintomas?.trim();

    if (!idadeValida || !sexoValido || !temSintoma) {
      if (!temSintoma) {
        alert('Selecione pelo menos um sintoma ou descreva em "Outros sintomas".');
      }
      return;
    }

    this.router.navigate(['/resultados'], { state: { triagem: payload } });
  }
}
