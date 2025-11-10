import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { FormComponent } from './pages/form/form.component';
import { ResultsComponent } from './pages/results/results.component';
import { HospitalDetailComponent } from './pages/hospital-detail/hospital-detail.component';
import { ConfirmComponent } from './pages/confirm/confirm.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MapaRotaComponent } from './components/mapa-rota/mapa-rota.component';
import { MapaRotaOsmComponent } from './components/mapa-rota-osm/mapa-rota-osm.component';
import { RotaGoogleComponent } from './components/rota-google/rota-google.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FormComponent,
    ResultsComponent,
    HospitalDetailComponent,
    ConfirmComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MapaRotaComponent,
    ReactiveFormsModule,
    MapaRotaOsmComponent,
    RotaGoogleComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
