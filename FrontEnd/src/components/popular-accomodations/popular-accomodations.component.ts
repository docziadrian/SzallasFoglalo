import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Accomodation } from '../../interfaces/accomodations';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-popular-accomodations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popular-accomodations.component.html',
  styleUrl: './popular-accomodations.component.scss',
})
export class PopularAccomodationsComponent implements OnInit {
  popularAccomodations: Accomodation[] = [];
  currentDate: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.updateCurrentDate();
    setInterval(() => this.updateCurrentDate(), 1000);
    this.loadPopularAccomodations();
  }

  updateCurrentDate(): void {
    const now = new Date();
    this.currentDate = now.toLocaleString('hu-HU');
  }

  async loadPopularAccomodations(): Promise<void> {
    const response = await this.apiService.selectAll('accomodations');
    if (response.status === 200 && response.data) {
      const all: Accomodation[] = response.data;
      // Randomly select 9 accommodations
      this.popularAccomodations = all
        .sort(() => 0.5 - Math.random())
        .slice(0, 9);
    }
  }

  viewAccomodation(id: number): void {
    this.router.navigate(['/szallasok', id]);
  }

  truncateText(text: string, length: number): string {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('hu-HU').format(price);
  }
}
