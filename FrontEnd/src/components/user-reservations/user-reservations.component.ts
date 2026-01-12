import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-user-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-reservations.component.html',
  styleUrl: './user-reservations.component.scss',
})
export class UserReservationsComponent implements OnInit {
  reservations: any[] = [];
  loading = false;

  constructor(
    private apiService: ApiService,
    private sessionService: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.sessionService.isLoggedIn()) {
      this.router.navigate(['/bejelentkezes']);
      return;
    }
    this.loadReservations();
  }

  async loadReservations() {
    this.loading = true;
    try {
      const res = await this.apiService.selectAll('bookings/my');
      if (res.status === 200 && res.data) {
        this.reservations = res.data;
      }
    } catch (error) {
      console.error('Hiba a foglalások betöltésekor:', error);
    } finally {
      this.loading = false;
    }
  }

  async cancelReservation(reservationId: number) {
    if (!confirm('Biztosan le akarod mondani a foglalást?')) {
      return;
    }

    try {
      const res = await this.apiService.deletePath(`/bookings/my/${reservationId}`);
      if (res.status === 200) {
        alert('Foglalás lemondva');
        this.loadReservations();
      } else {
        alert('Hiba történt a lemondás során');
      }
    } catch (error) {
      console.error('Hiba a foglalás lemondásakor:', error);
      alert('Hiba történt a lemondás során');
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU');
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Megerősítve';
      case 'pending':
        return 'Függőben';
      case 'cancelled':
        return 'Lemondva';
      default:
        return status;
    }
  }
}
