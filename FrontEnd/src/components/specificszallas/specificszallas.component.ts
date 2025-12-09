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

@Component({
  selector: 'app-specificszallas',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './specificszallas.component.html',
  styleUrl: './specificszallas.component.scss',
})
export class SpecificszallasComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    selectable: true,
    selectMirror: true,
    selectOverlap: false,
    unselectAuto: false,
    locale: 'hu',
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: '',
    },
    validRange: {
      start: new Date().toISOString().split('T')[0],
    },
    dayCellClassNames: (arg) => {
      return this.getDayCellClass(arg.date);
    },
    dateClick: (info) => {
      this.handleDateClick(info.date);
    },
    events: [],
  };

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

  // Naptár popup
  showCalendarPopup: boolean = false;
  selectingCheckIn: boolean = true;
  tempCheckInDate: Date | null = null;
  tempCheckOutDate: Date | null = null;
  bookedDates: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiservice: ApiService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.checkInDate = 'Kérlek válassz!';

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.checkOutDate = 'Kérlek válassz!';

    this.route.params.subscribe((params) => {
      this.urlId = params['id'];
      if (this.urlId) {
        this.loadAccomodationData();
        this.loadBookedDates();
      } else {
        this.router.navigate(['/']);
      }
    });
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

  async loadBookedDates() {
    try {
      const response = await this.apiservice.selectAccomodationBookings(
        parseInt(this.urlId, 10)
      );

      if (response.status === 200 && response.data) {
        this.bookedDates = [];

        response.data.forEach((booking: any) => {
          const startDate = new Date(booking.startDate);
          const endDate = new Date(booking.endDate);

          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          let currentDate = new Date(startDate);
          while (currentDate < endDate) {
            this.bookedDates.push(this.formatDate(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });

        console.log('Booked dates loaded:', this.bookedDates);
        this.updateCalendarEvents();
      }
    } catch (error) {
      console.error('Error loading booked dates:', error);
      this.bookedDates = [];
      this.updateCalendarEvents();
    }
  }

  updateCalendarEvents() {
    const events: EventInput[] = this.bookedDates.map((date) => ({
      start: date,
      display: 'background',
      backgroundColor: '#ef4444',
      classNames: ['booked-date'],
    }));

    this.calendarOptions.events = events;
  }

  getDayCellClass(date: Date): string[] {
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    const dateStr = this.formatDate(localDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.formatDate(today);

    if (dateStr < todayStr) {
      return ['past-date'];
    }

    if (this.bookedDates.includes(dateStr)) {
      return ['booked-date'];
    }

    // Highlight selected range
    if (this.tempCheckInDate && this.tempCheckOutDate) {
      const tempCheckInStr = this.formatDate(this.tempCheckInDate);
      const tempCheckOutStr = this.formatDate(this.tempCheckOutDate);

      if (dateStr >= tempCheckInStr && dateStr < tempCheckOutStr) {
        return ['selected-range'];
      }
    }

    return ['available-date'];
  }

  handleDateClick(selectedDate: Date) {
    const localDate = new Date(selectedDate);
    localDate.setHours(0, 0, 0, 0);
    const selectedDateStr = this.formatDate(localDate);

    // Check if date is booked
    if (this.bookedDates.includes(selectedDateStr)) {
      alert('Ez a dátum már foglalt!');
      return;
    }

    if (this.selectingCheckIn) {
      // Select check-in date
      this.tempCheckInDate = localDate;
      this.checkInDate = selectedDateStr;
      this.selectingCheckIn = false;
      this.calendarOptions = { ...this.calendarOptions };
    } else {
      // Select check-out date
      const checkInDate = this.tempCheckInDate!;

      if (localDate <= checkInDate) {
        alert('A távozás dátuma az érkezés után kell legyen!');
        return;
      }

      // Check maximum 12 nights
      const diffTime = localDate.getTime() - checkInDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 12) {
        alert('Maximum 12 éjszakát lehet foglalni!');
        return;
      }

      // Check if any date in range is booked
      let currentDate = new Date(checkInDate);
      while (currentDate < localDate) {
        const currentDateStr = this.formatDate(currentDate);
        if (this.bookedDates.includes(currentDateStr)) {
          alert('A kiválasztott időszakban van foglalt dátum!');
          return;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      this.tempCheckOutDate = localDate;
      this.checkOutDate = selectedDateStr;
      this.closeCalendarPopup();
      this.calculatePrice();
    }
  }

  openCalendarPopup() {
    this.showCalendarPopup = true;
    this.selectingCheckIn = true;

    // Load existing dates if available
    if (this.checkInDate) {
      const checkIn = new Date(this.checkInDate);
      checkIn.setHours(0, 0, 0, 0);
      this.tempCheckInDate = checkIn;
    } else {
      this.tempCheckInDate = null;
    }

    if (this.checkOutDate) {
      const checkOut = new Date(this.checkOutDate);
      checkOut.setHours(0, 0, 0, 0);
      this.tempCheckOutDate = checkOut;
    } else {
      this.tempCheckOutDate = null;
    }

    // Force calendar refresh to show selected range
    this.calendarOptions = { ...this.calendarOptions };
  }

  closeCalendarPopup() {
    this.showCalendarPopup = false;
    this.selectingCheckIn = true;
  }

  calculatePrice() {
    if (this.checkInDate && this.checkOutDate && this.szallasData) {
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

    // TODO: Replace with actual user ID from authentication
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

    console.log('Creating booking:', bookingData);

    try {
      const response = await this.apiservice.createBooking(bookingData);

      if (response.status === 201) {
        alert('Foglalás sikeresen létrehozva!');
        await this.loadBookedDates();
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
}
