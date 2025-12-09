import { Routes } from '@angular/router';
import { LandingpageComponent } from '../components/landingpage/landingpage.component';
import { SpecificszallasComponent } from '../components/specificszallas/specificszallas.component';
import { RegistrationComponent } from '../components/auth/registration/registration.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingpageComponent,
  },
  {
    path: 'szallasok/:id',
    component: SpecificszallasComponent,
  },
  {
    path: 'registration',
    component: RegistrationComponent,
  },
];
