import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Accomodation } from '../../interfaces/accomodations';
import { AccomodationImage } from '../../interfaces/accomodation_images';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-specificszallas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './specificszallas.component.html',
  styleUrl: './specificszallas.component.scss',
})
export class SpecificszallasComponent implements OnInit {
  urlId: string = '';
  szallasData: Accomodation | null = null;
  images: AccomodationImage[] = [];

  checkInDate: string = '';
  checkOutDate: string = '';
  guests: number = 1;
  nights: number = 0;
  totalPrice: number = 0;

  showGallery: boolean = false;
  currentImageIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiservice: ApiService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.checkInDate = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.checkOutDate = tomorrow.toISOString().split('T')[0];

    this.route.params.subscribe((params) => {
      this.urlId = params['id'];
      if (this.urlId) {
        this.loadAccomodationData();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  async loadAccomodationData() {
    try {
      const response = await this.apiservice.select(
        'accomodations',
        parseInt(this.urlId, 10)
      );
      if (response.status === 200 && response.data) {
        this.szallasData = response.data;
        await this.loadImages();
        this.calculatePrice();
      } else {
        console.log('Nincs ilyen szállás...');
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Error loading accommodation:', error);
      this.router.navigate(['/']);
    }
  }

  async loadImages() {
    try {
      const response = await this.apiservice.selectAccomodationImages(
        parseInt(this.urlId, 10)
      );
      if (response.status === 200 && response.data) {
        this.images = response.data;
        console.log('Images loaded:', this.images.length);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }

  calculatePrice() {
    if (this.checkInDate && this.checkOutDate && this.szallasData) {
      const checkIn = new Date(this.checkInDate);
      const checkOut = new Date(this.checkOutDate);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.totalPrice =
        this.nights * this.guests * this.szallasData.priceforone;
    }
  }

  onDateChange() {
    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);

    if (checkOut <= checkIn) {
      const newCheckOut = new Date(checkIn);
      newCheckOut.setDate(newCheckOut.getDate() + 1);
      this.checkOutDate = newCheckOut.toISOString().split('T')[0];
    }

    this.calculatePrice();
  }

  onGuestsChange() {
    if (this.guests < 1) this.guests = 1;
    this.calculatePrice();
  }

  openGallery(index: number) {
    this.currentImageIndex = index;
    this.showGallery = true;
  }

  closeGallery() {
    this.showGallery = false;
  }

  nextImage() {
    if (this.images.length > 0) {
      this.currentImageIndex =
        (this.currentImageIndex + 1) % this.images.length;
    }
  }

  prevImage() {
    if (this.images.length > 0) {
      this.currentImageIndex =
        (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    }
  }

  makeReservation() {
    console.log('Foglalási adatok:', {
      accomodation: this.szallasData?.name,
      checkIn: this.checkInDate,
      checkOut: this.checkOutDate,
      guests: this.guests,
      nights: this.nights,
      totalPrice: this.totalPrice,
    });
    // TODO: Reservation API hívás
  }

  get mainImage(): AccomodationImage | undefined {
    return this.images.length > 0 ? this.images[0] : undefined;
  }

  get thumbnailImages(): AccomodationImage[] {
    return this.images.slice(1, 4);
  }

  get minCheckInDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get minCheckOutDate(): string {
    const checkIn = new Date(this.checkInDate);
    checkIn.setDate(checkIn.getDate() + 1);
    return checkIn.toISOString().split('T')[0];
  }
}
