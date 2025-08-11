import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { FormComponent } from './pages/form/form.component';
import { ResultsComponent } from './pages/results/results.component';
import { HospitalDetailComponent } from './pages/hospital-detail/hospital-detail.component';
import { ConfirmComponent } from './pages/confirm/confirm.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'triagem', component: FormComponent },
  { path: 'resultados', component: ResultsComponent },
  { path: 'hospital/:id', component: HospitalDetailComponent },
  { path: 'confirmacao', component: ConfirmComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
