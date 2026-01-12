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
          Köszönjük a foglalást!
        </p>
        <button
          (click)="goHome()"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Vissza a főoldalra
        </button>
      </div>

      <div
        *ngIf="showModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        (click)="closeModal()"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-lg font-bold text-gray-900 mb-2">Foglalás visszaigazolás</h3>
          <p class="text-sm text-gray-700 mb-4">
            Technikai okokból most nem tudunk e-mailt küldeni. Az alábbi adatok szolgálnak visszaigazolásként.
          </p>

          <div class="space-y-2 text-sm text-gray-800" *ngIf="booking">
            <div><span class="font-semibold">Név:</span> {{ booking.bookingName || '-' }}</div>
            <div><span class="font-semibold">Szállás:</span> {{ booking.accommodationName || booking.accommodationId || '-' }}</div>
            <div><span class="font-semibold">Érkezés:</span> {{ booking.startDate || '-' }}</div>
            <div><span class="font-semibold">Távozás:</span> {{ booking.endDate || '-' }}</div>
            <div><span class="font-semibold">Vendégek:</span> {{ booking.persons || '-' }}</div>
            <div><span class="font-semibold">Végösszeg:</span> {{ booking.totalPrice || '-' }}</div>
          </div>

          <div class="space-y-2 text-sm text-gray-800" *ngIf="!booking">
            <div>Nem sikerült lekérni a foglalási adatokat.</div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              (click)="downloadTxt()"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Letöltés .txt
            </button>
            <button
              type="button"
              (click)="closeModal()"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Bezárás
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PaymentSuccessComponent implements OnInit {
  showModal = false;
  booking: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const sessionId = params['session_id'];
      if (sessionId) {
        try {
          const resp = await this.api.post('/payments/verify-booking', { sessionId });
          const b = resp?.data?.booking ?? null;
          this.booking = b;
          this.showModal = true;
        } catch (e) {
          console.error(e);
          this.booking = null;
          this.showModal = true;
        }
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  closeModal() {
    this.showModal = false;
  }

  downloadTxt() {
    const content = this.formatTxt();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'foglalas-visszaigazolas.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  private formatTxt(): string {
    const b = this.booking || {};
    const lines = [
      'Foglalás visszaigazolás',
      '',
      'Technikai okokból most nem tudunk e-mailt küldeni.',
      'Az alábbi adatok szolgálnak visszaigazolásként.',
      '',
      `Név: ${b.bookingName || '-'}`,
      `Szállás: ${b.accommodationName || b.accommodationId || '-'}`,
      `Érkezés: ${b.startDate || '-'}`,
      `Távozás: ${b.endDate || '-'}`,
      `Vendégek: ${b.persons || '-'}`,
      `Végösszeg: ${b.totalPrice || '-'}`,
      '',
      `Dátum: ${new Date().toISOString()}`,
    ];

    return lines.join('\n');
  }
}
