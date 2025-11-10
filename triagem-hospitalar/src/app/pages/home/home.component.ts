import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  currentYear = new Date().getFullYear();
  geoError: string | null = null;
  stats = { waitMin: 24, onDuty: 37, hospitals: 8 }; // TODO: substituir por dados reais via WebSocket/ApiService

  constructor(private router: Router) {}

  startTriage() {
    this.router.navigate(['/triagem']);
  }

  useMyLocation() {
    this.geoError = null;
    if (!('geolocation' in navigator)) {
      this.geoError = 'Seu navegador não permite obter a localização.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.router.navigate(['/resultados'], {
          queryParams: { lat: latitude, lng: longitude }
        });
      },
      (err) => {
        this.geoError = err.message || 'Não foi possível obter sua localização.';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
}
