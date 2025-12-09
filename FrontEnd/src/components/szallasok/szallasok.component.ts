import { Component, OnInit } from '@angular/core';

import { Accomodation } from '../../interfaces/accomodations';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-szallasok',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './szallasok.component.html',
  styleUrl: './szallasok.component.scss',
})
export class SzallasokComponent implements OnInit {
  MAX_DISPLAY_LIMIT = 9;

  accomodations: Accomodation[] = [];

  constructor(private apiservice: ApiService) {}
  ngOnInit(): void {
    this.checkSession();
    this.loadAccomodationsArray();
  }

  checkSession() {
    // Ha az url tartalmazza a 'szallasok' szot, akkor nincs max megjelenítési limit
    if (window.location.href.indexOf('accomodations') !== -1) {
      this.MAX_DISPLAY_LIMIT = Infinity;
    }
  }

  loadAccomodationsArray(): void {
    // Itt fog lenni a szállásokat egy szolgáltatásból hivas
    this.apiservice.selectAll('accomodations').then((response) => {
      if (response.status === 200 && response.data) {
        const servedData: Accomodation[] = response.data;
        if (servedData.length > 0) {
          if (this.MAX_DISPLAY_LIMIT === Infinity) {
            this.accomodations = servedData;
          } else {
            // Majd itt kéne szürni, hogy a legjobbat, a legnépszerűbbet stb.
            this.accomodations = servedData.slice(0, this.MAX_DISPLAY_LIMIT);
          }
        }
      }
    });
  }

  goToSpecificSzallas(id: number): void {
    window.location.href = `/szallasok/${id}`;
  }
}
