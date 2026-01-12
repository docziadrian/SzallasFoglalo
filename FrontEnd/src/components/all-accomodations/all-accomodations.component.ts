import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Accomodation } from '../../interfaces/accomodations';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-all-accomodations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-accomodations.component.html',
  styleUrl: './all-accomodations.component.scss',
})
export class AllAccomodationsComponent implements OnInit {
  allAccomodations: Accomodation[] = [];
  filteredAccomodations: Accomodation[] = [];
  searchTerm: string = '';
  sortBy: string = 'rating';

  minPrice: number = 0;
  maxPrice: number = 0;
  currentMinPrice: number = 0;
  currentMaxPrice: number = 0;

  selectedRating: string = 'all';

  isFilterOpen: boolean = false;

  startDate: string | null = null;
  endDate: string | null = null;
  people: number | null = null;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.startDate = params['startDate'];
      this.endDate = params['endDate'];
      this.people = params['people'] ? Number(params['people']) : null;
    });
    this.loadAccomodations();
  }

  private getDestinationFromUrl(): string | null {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const possibleParams = ['destination', 'dest', 'location'];
      for (const p of possibleParams) {
        const v = params.get(p);
        if (v && v.trim().length) return decodeURIComponent(v).trim();
      }

      const segments = url.pathname
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);
      const destIndex = segments.findIndex(
        (s) =>
          s.toLowerCase() === 'destination' || s.toLowerCase() === 'location'
      );
      if (destIndex >= 0 && segments.length > destIndex + 1) {
        return decodeURIComponent(segments[destIndex + 1]).trim();
      }
    } catch {
    }
    return null;
  }

  async loadAccomodations(): Promise<void> {
    const response = await this.apiService.selectAll('accomodations');
    if (response.status === 200 && response.data) {
      this.allAccomodations = response.data;

      const prices = this.allAccomodations
        .map((a) => Number(a.priceforone))
        .filter((n) => Number.isFinite(n));
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        this.minPrice = Math.max(0, min);
        this.maxPrice = Math.max(this.minPrice, max);
        this.currentMinPrice = this.minPrice;
        this.currentMaxPrice = this.maxPrice;
      } else {
        this.minPrice = 0;
        this.maxPrice = 0;
        this.currentMinPrice = 0;
        this.currentMaxPrice = 0;
      }

      const destination = this.getDestinationFromUrl();
      if (destination) {
        this.searchTerm = destination.toLowerCase();
      }

      this.applyFilters();
    }
  }

  applyFilters(): void {
    let filtered = [...this.allAccomodations];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (acc) =>
          acc.name.toLowerCase().includes(term) ||
          acc.city.toLowerCase().includes(term) ||
          acc.description.toLowerCase().includes(term)
      );
    }

    filtered = filtered.filter(
      (acc) =>
        acc.priceforone >= this.currentMinPrice &&
        acc.priceforone <= this.currentMaxPrice
    );

    if (this.selectedRating === 'high') {
      filtered = filtered.filter((acc) => acc.avgrating >= 8.0);
    } else if (this.selectedRating === 'medium') {
      filtered = filtered.filter(
        (acc) => acc.avgrating >= 5.0 && acc.avgrating < 8.0
      );
    } else if (this.selectedRating === 'low') {
      filtered = filtered.filter((acc) => acc.avgrating < 5.0);
    }

    switch (this.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.avgrating - a.avgrating);
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.priceforone - b.priceforone);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.priceforone - a.priceforone);
        break;
    }

    this.filteredAccomodations = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  onPriceChange(): void {
    this.applyFilters();
  }

  onRatingChange(): void {
    this.applyFilters();
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  viewAccomodation(id: number): void {
    const queryParams: any = {};
    if (this.startDate) queryParams.startDate = this.startDate;
    if (this.endDate) queryParams.endDate = this.endDate;
    if (this.people) queryParams.people = this.people;

    this.router.navigate(['/szallasok', id], { queryParams });
  }

  truncateText(text: string, length: number): string {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('hu-HU').format(price);
  }
}
