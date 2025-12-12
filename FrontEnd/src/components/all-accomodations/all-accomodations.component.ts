import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Accomodation } from '../../interfaces/accomodations';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-all-accomodations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-accomodations.component.html',
  styleUrl: './all-accomodations.component.scss'
})
export class AllAccomodationsComponent implements OnInit {
  allAccomodations: Accomodation[] = [];
  filteredAccomodations: Accomodation[] = [];
  searchTerm: string = '';
  sortBy: string = 'rating';
  
  minPrice: number = 1000;
  maxPrice: number = 130000;
  currentMinPrice: number = 1000;
  currentMaxPrice: number = 130000;
  
  selectedRating: string = 'all';
  
  isFilterOpen: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAccomodations();
  }

  async loadAccomodations(): Promise<void> {
    const response = await this.apiService.selectAll('accomodations');
    if (response.status === 200 && response.data) {
      this.allAccomodations = response.data;
      this.applyFilters();
    }
  }

  applyFilters(): void {
    let filtered = [...this.allAccomodations];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.name.toLowerCase().includes(term) ||
        acc.city.toLowerCase().includes(term) ||
        acc.description.toLowerCase().includes(term)
      );
    }

    filtered = filtered.filter(acc => 
      acc.priceforone >= this.currentMinPrice && 
      acc.priceforone <= this.currentMaxPrice
    );

    if (this.selectedRating === 'high') {
      filtered = filtered.filter(acc => acc.avgrating >= 8.0);
    } else if (this.selectedRating === 'medium') {
      filtered = filtered.filter(acc => acc.avgrating >= 5.0 && acc.avgrating < 8.0);
    } else if (this.selectedRating === 'low') {
      filtered = filtered.filter(acc => acc.avgrating < 5.0);
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
    window.location.href = `/szallasok/${id}`;
  }

  truncateText(text: string, length: number): string {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('hu-HU').format(price);
  }
}