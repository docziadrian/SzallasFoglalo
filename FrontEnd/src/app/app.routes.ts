import { Routes } from '@angular/router';
import { LandingpageComponent } from '../components/landingpage/landingpage.component';
import { SpecificszallasComponent } from '../components/specificszallas/specificszallas.component';
import { RegistrationComponent } from '../components/auth/registration/registration.component';
import { AllAccomodationsComponent } from '../components/all-accomodations/all-accomodations.component';
import { BestAccomodationsComponent } from '../components/best-accomodations/best-accomodations.component';
import { PopularAccomodationsComponent } from '../components/popular-accomodations/popular-accomodations.component';
import { AdminComponent } from '../components/admin/admin.component';
import { PaymentSuccessComponent } from '../components/payment-success/payment-success.component';
import { PaymentCancelComponent } from '../components/payment-cancel/payment-cancel.component';

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
    path: 'accomodations',
    component: AllAccomodationsComponent,
  },
  {
    path: 'accomodations/destination/:destination',
    component: AllAccomodationsComponent,
  },
  {
    path: 'best',
    component: BestAccomodationsComponent,
  },
  {
    path: 'popular',
    component: PopularAccomodationsComponent,
  },
  {
    path: 'admin',
    component: AdminComponent,
  },
  {
    path: 'payment-success',
    component: PaymentSuccessComponent,
  },
  {
    path: 'payment-cancel',
    component: PaymentCancelComponent,
  },
];
