import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="min-h-screen bg-gray-100 flex flex-col justify-center items-center"
    >
      <div class="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <svg
          class="w-16 h-16 text-red-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          Fizetés megszakítva
        </h2>
        <p class="text-gray-600 mb-6">
          A fizetési folyamat megszakadt vagy sikertelen volt. Kérjük próbáld
          újra.
        </p>
        <button
          (click)="goHome()"
          class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Vissza a főoldalra
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class PaymentCancelComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}
