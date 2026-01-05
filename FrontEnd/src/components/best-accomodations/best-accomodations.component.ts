import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Accomodation } from '../../interfaces/accomodations';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-best-accomodations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './best-accomodations.component.html',
  styleUrl: './best-accomodations.component.scss',
})
export class BestAccomodationsComponent implements OnInit {
  bestAccomodations: Accomodation[] = [];

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadBestAccomodations();
  }

  async loadBestAccomodations(): Promise<void> {
    const response = await this.apiService.selectAll('accomodations');
    if (response.status === 200 && response.data) {
      const all: Accomodation[] = response.data;
      // Sort by average rating descending and take top 9
      this.bestAccomodations = all
        .sort((a, b) => b.avgrating - a.avgrating)
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
