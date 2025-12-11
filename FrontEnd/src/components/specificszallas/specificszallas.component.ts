import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Accomodation } from '../../interfaces/accomodations';
import { AccomodationImage } from '../../interfaces/accomodation_images';
import { ApiService } from '../../services/api.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { FeatureIconComponent } from '../feature-icon/feature-icon.component';
import { SpecialFeature } from '../../interfaces/specialfeature';

import { SafePipe } from '../../pipes/SafePipe';

import { UserReview, ReviewStats } from '../../interfaces/review';




@Component({
  selector: 'app-specificszallas',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, FeatureIconComponent, SafePipe],
  templateUrl: './specificszallas.component.html',
  styleUrl: './specificszallas.component.scss',
})
export class SpecificszallasComponent implements OnInit {
  reviews: UserReview[] = [];
  reviewStats: ReviewStats | null = null;
  showAllReviews: boolean = false;
  reviewsToShow: number = 3;
  features: SpecialFeature[] = [];
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    selectable: false,
    locale: 'hu',
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: '',
    },
    validRange: {
      start: new Date().toISOString().split('T')[0],
      end: this.getMaxDate(),
    },
    dayCellContent: (arg) => {
      return this.getDayCellContent(arg);
    },
    dateClick: (info) => {
      this.handleDateClick(info.date);
    },
    events: [],
  };

  urlId: string = '';
  szallasData: Accomodation | null = null;
  images: AccomodationImage[] = [];
  availability: Map<string, any> = new Map();

  checkInDate: string = '';
  checkOutDate: string = '';
  guests: number = 1;
  nights: number = 0;
  totalPrice: number = 0;

  showGallery: boolean = false;
  currentImageIndex: number = 0;

  showCalendarPopup: boolean = false;
  selectingCheckIn: boolean = true;
  tempCheckInDate: Date | null = null;
  tempCheckOutDate: Date | null = null;


  // Leiras - összecsukva v. nem
  
  isDescriptionExpanded: boolean = false;
  descriptionPreviewLength: number = 1000;

  get descriptionPreview(): string {
    if (!this.szallasData?.description) return '';
    if (this.szallasData.description.length <= this.descriptionPreviewLength) {
      return this.szallasData.description;
    }
    return this.szallasData.description.substring(0, this.descriptionPreviewLength) + '...';
  }

  get shouldShowMoreButton(): boolean {
    return (this.szallasData?.description?.length || 0) > this.descriptionPreviewLength;
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  // Leiras vége


  // TÉRKÉP
  // Térkép navigáció
  navigateToGoogleMaps(): void {
    if (!this.szallasData) return;
    const address = encodeURIComponent(this.szallasData.full_address);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(url, '_blank');
  }

  navigateToAppleMaps(): void {
    if (!this.szallasData) return;
    const address = encodeURIComponent(this.szallasData.full_address);
    const url = `http://maps.apple.com/?address=${address}`;
    window.open(url, '_blank');
  }


  //TODO: API Key a Google Cloud Console bol
  get mapEmbedUrl(): string {
    if (!this.szallasData) return '';
    const address = encodeURIComponent(this.szallasData.full_address);
    // OpenStreetMap alternatíva
    return `https://www.openstreetmap.org/export/embed.html?bbox=19.0,47.0,19.1,47.1&layer=mapnik&marker=${this.szallasData.city}`;
  }
  //TÉRKÉP VÉGE


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiservice: ApiService
  ) {}

  async ngOnInit() {
    this.checkInDate = 'Kérlek válassz dátumot!';
    this.checkOutDate = 'Kérlek válassz dátumot!';

    this.route.params.subscribe(async (params) => {
      this.urlId = params['id'];
      if (this.urlId) {
        await this.loadAccomodationData();
        await this.loadAvailability();
        
        // Vélemények betöltése a szállás adatok után
        await this.loadReviews();
        await this.loadReviewStats();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  async loadReviews() {
    if (!this.szallasData) {
      console.warn('Szállás adatok még nem töltődtek be');
      return;
    }
    
    try {
      const response = await this.apiservice.selectAccomodationReviews(
        this.szallasData.id,
        this.showAllReviews ? 100 : this.reviewsToShow,
        0,
        'recent'
      );
      
      if (response.status === 200) {
        this.reviews = response.data;
        console.log('Vélemények betöltve:', this.reviews);
      } else {
        console.error('Hiba a vélemények betöltésekor:', response.message);
      }
    } catch (error) {
      console.error('Hiba a vélemények lekérésekor:', error);
    }
  }

  async loadReviewStats() {
    if (!this.szallasData) {
      console.warn('Szállás adatok még nem töltődtek be');
      return;
    }
    
    try {
      const response = await this.apiservice.selectAccomodationReviewStats(
        this.szallasData.id
      );
      
      if (response.status === 200) {
        this.reviewStats = response.data;
        console.log('Vélemény statisztikák betöltve:', this.reviewStats);
      } else {
        console.error('Hiba a statisztikák betöltésekor:', response.message);
      }
    } catch (error) {
      console.error('Hiba a statisztikák lekérésekor:', error);
    }
  }

  
  async toggleReviews() {
    this.showAllReviews = !this.showAllReviews;
    await this.loadReviews();
  }

  getStarArray(rating: number): boolean[] {
    return Array(10).fill(false).map((_, i) => i < rating);
  }

  formatDateVelemeny(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getMaxDate(): string {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return this.formatDate(maxDate);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        await this.loadFeatures();
      } else {
        console.log('Nincs ilyen szállás...');
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Error loading accommodation:', error);
      this.router.navigate(['/']);
    }
  }

  async loadFeatures() {
    try {
      const response = await this.apiservice.selectAccomodationFeatures(
        parseInt(this.urlId, 10)
      );
      if (response.status === 200 && response.data) {
        this.features = response.data;
      }
    } catch (error) {
      console.error('Error loading features:', error);
    }
  }

  async loadImages() {
    try {
      const response = await this.apiservice.selectAccomodationImages(
        parseInt(this.urlId, 10)
      );
      if (response.status === 200 && response.data) {
        this.images = response.data;
      }
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }

  async loadAvailability() {
    try {
      const today = this.formatDate(new Date());
      const maxDate = this.getMaxDate();

      const response = await this.apiservice.selectAccomodationAvailability(
        parseInt(this.urlId, 10),
        today,
        maxDate
      );

      if (response.status === 200 && response.data) {
        this.availability.clear();
        response.data.forEach((day: any) => {
          this.availability.set(day.date.split('T')[0], {
            reserved: day.reserved_rooms,
            max: day.maxRooms,
            available: day.available_rooms,
          });
        });
        this.updateCalendarEvents();
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  }

  updateCalendarEvents() {
    this.calendarOptions = { ...this.calendarOptions };
  }

  getDayCellContent(arg: any) {
    const dateStr = this.formatDate(arg.date);
    const avail = this.availability.get(dateStr);
    const today = this.formatDate(new Date());
    const isToday = dateStr === today;

    if (!avail) return { html: arg.dayNumberText };

    let icon = '';
    let color = '';
    let borderStyle = '';
    let textColor = '#1f2937';

    if (avail.available === 0) {
      icon = '🔴';
      color = '#fca5a5';
    } else if (avail.available <= 2) {
      icon = '🟡';
      color = '#fde047';
    } else {
      icon = '🟢';
      color = '#86efac';
    }

    const checkInStr = this.tempCheckInDate
      ? this.formatDate(this.tempCheckInDate)
      : null;
    const checkOutStr = this.tempCheckOutDate
      ? this.formatDate(this.tempCheckOutDate)
      : null;

    if (checkInStr && dateStr === checkInStr) {
      color = '#fb923c';
      borderStyle = 'border: 3px solid #ea580c;';
      textColor = '#ffffff';
    } else if (checkOutStr && dateStr === checkOutStr) {
      color = '#fb923c';
      borderStyle = 'border: 3px solid #ea580c;';
      textColor = '#ffffff';
    } else if (
      checkInStr &&
      checkOutStr &&
      dateStr > checkInStr &&
      dateStr < checkOutStr
    ) {
      color = '#fb923c';
      textColor = '#ffffff';
    } else if (checkInStr && !checkOutStr && dateStr > checkInStr) {
      color = '#fed7aa';
    }

    if (isToday && !borderStyle) {
      borderStyle = 'border: 3px solid #ffff;';
    }

    return {
      html: `
        <div style="background: ${color}; padding: 4px; border-radius: 4px; height: 100%; ${borderStyle}">
          <div style="font-weight: bold; color: ${textColor};">${
        arg.dayNumberText
      }</div>
          ${
            isToday && !checkInStr
              ? '<div style="font-size: 9px; color: #ffff; font-weight: bold;">MAI NAP</div>'
              : ''
          }
          <div style="font-size: 20px; margin-top: 4px;">${icon}</div>
          <div style="font-size: 11px; margin-top: 2px; color: ${textColor}; font-weight: 600;">${
        avail.available
      }/${avail.max}</div>
        </div>
      `,
    };
  }

  handleDateClick(selectedDate: Date) {
    const localDate = new Date(selectedDate);
    localDate.setHours(0, 0, 0, 0);
    const selectedDateStr = this.formatDate(localDate);

    const avail = this.availability.get(selectedDateStr);

    if (!avail || avail.available === 0) {
      alert('Erre a napra nincs szabad szoba!');
      return;
    }

    if (this.selectingCheckIn) {
      this.tempCheckInDate = localDate;
      this.checkInDate = selectedDateStr;
      this.selectingCheckIn = false;
      this.updateCalendarEvents();
    } else {
      const checkInDate = this.tempCheckInDate!;

      if (localDate <= checkInDate) {
        alert('A távozás dátuma az érkezés után kell legyen!');
        return;
      }

      const diffTime = localDate.getTime() - checkInDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 12) {
        alert('Maximum 12 éjszakát lehet foglalni!');
        return;
      }

      let currentDate = new Date(checkInDate);
      while (currentDate < localDate) {
        const currentDateStr = this.formatDate(currentDate);
        const dayAvail = this.availability.get(currentDateStr);

        if (!dayAvail || dayAvail.available === 0) {
          alert('A kiválasztott időszakban nincs minden napra szabad szoba!');
          return;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      this.tempCheckOutDate = localDate;
      this.checkOutDate = selectedDateStr;
      this.calculatePrice();
      this.selectingCheckIn = true;
      this.updateCalendarEvents();
      this.closeCalendarPopup();
    }
  }

  resetSelection() {
    this.tempCheckInDate = null;
    this.tempCheckOutDate = null;
    this.checkInDate = 'Kérlek válassz dátumot!';
    this.checkOutDate = 'Kérlek válassz dátumot!';
    this.selectingCheckIn = true;
    this.nights = 0;
    this.totalPrice = 0;
    this.calendarOptions = { ...this.calendarOptions };
  }

  openCalendarPopup() {
    this.showCalendarPopup = true;
    this.selectingCheckIn = true;

    if (this.checkInDate !== 'Kérlek válassz dátumot!') {
      const checkIn = new Date(this.checkInDate);
      checkIn.setHours(0, 0, 0, 0);
      this.tempCheckInDate = checkIn;
    } else {
      this.tempCheckInDate = null;
    }

    if (this.checkOutDate !== 'Kérlek válassz dátumot!') {
      const checkOut = new Date(this.checkOutDate);
      checkOut.setHours(0, 0, 0, 0);
      this.tempCheckOutDate = checkOut;
      //this.closeCalendarPopup();
    } else {
      this.tempCheckOutDate = null;
    }

    this.calendarOptions = { ...this.calendarOptions };
  }

  closeCalendarPopup() {
    this.showCalendarPopup = false;
    this.selectingCheckIn = true;
  }

  calculatePrice() {
    if (
      this.checkInDate !== 'Kérlek válassz dátumot!' &&
      this.checkOutDate !== 'Kérlek válassz dátumot!' &&
      this.szallasData
    ) {
      const checkIn = new Date(this.checkInDate);
      const checkOut = new Date(this.checkOutDate);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);

      const diffTime = checkOut.getTime() - checkIn.getTime();
      this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.totalPrice =
        this.nights * this.guests * this.szallasData.priceforone;
    }
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

  async makeReservation() {
    if (!this.szallasData) {
      alert('Hiba történt a szállás adatok betöltése során!');
      return;
    }

    if (
      this.checkInDate === 'Kérlek válassz dátumot!' ||
      this.checkOutDate === 'Kérlek válassz dátumot!'
    ) {
      alert('Kérlek válassz érkezési és távozási dátumot!');
      return;
    }

    const userId = 1;

    const bookingData = {
      userId: userId,
      accommodationId: parseInt(this.urlId, 10),
      startDate: this.checkInDate,
      endDate: this.checkOutDate,
      persons: this.guests,
      totalPrice: this.totalPrice,
      status: 'confirmed',
    };

    try {
      const response = await this.apiservice.createBooking(bookingData);

      if (response.status === 201) {
        alert('Foglalás sikeresen létrehozva!');
        await this.loadAvailability();
        this.resetSelection();
      } else {
        alert('Hiba történt a foglalás során: ' + response.message);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Hiba történt a foglalás során!');
    }
  }

  get mainImage(): AccomodationImage | undefined {
    return this.images.length > 0 ? this.images[0] : undefined;
  }

  get thumbnailImages(): AccomodationImage[] {
    return this.images.slice(1, 4);
  }

  get calendarTitle(): string {
    return this.selectingCheckIn
      ? 'Válassz érkezési dátumot'
      : 'Válassz távozási dátumot (max 12 éjszaka)';
  }

  get checkoutInfo(): string {
    if (this.checkOutDate !== 'Kérlek válassz dátumot!') {
      return `${this.checkOutDate} nap 12:00-ig el kell hagynod a szállást!`;
    }
    return '';
  }
}
