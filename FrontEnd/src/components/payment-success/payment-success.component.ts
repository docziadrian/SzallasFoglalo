import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="min-h-screen bg-gray-100 flex flex-col justify-center items-center"
    >
      <div class="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <svg
          class="w-16 h-16 text-green-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Sikeres fizetés!</h2>
        <p class="text-gray-600 mb-6">
          Köszönjük a foglalást! Az automatikus visszaigazolást hamarosan
          elküldjük.
        </p>
        <button
          (click)="goHome()"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Vissza a főoldalra
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class PaymentSuccessComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    // Session id helps in tracking but for now we manually call booking creation if session_id is present
    this.route.queryParams.subscribe(async (params) => {
      const sessionId = params['session_id'];
      if (sessionId) {
        // Option A: Call backend to retrieve session and insert booking if not exists
        // This requires a new endpoint in backend to fetch session details and insert booking manually if webhook failed.
        // Option B (Simple & Insecure): If we passed booking data in url (not safe).

        // Better approach:
        // Let's call a backend endpoint verify-payment which takes session_id, checks stripe, and inserts booking if paid.
        try {
          await this.api.post('/payments/verify-booking', { sessionId });
          // If already inserted by webhook, backend should handle duplication or ignore
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
