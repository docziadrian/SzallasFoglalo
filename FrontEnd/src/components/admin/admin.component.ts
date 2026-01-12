import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SessionService } from '../../services/session.service';
import { User } from '../../interfaces/user';
import { Accomodation } from '../../interfaces/accomodations';
import { UserReview } from '../../interfaces/review';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  activeTab: 'users' | 'accomodations' | 'reviews' | 'bookings' = 'users';

  users: User[] = [];
  pageSize = 10;
  currentPageUsers = 1;
  currentPageAccomodations = 1;
  currentPageReviews = 1;
  currentPageBookings = 1;
  public Math = Math;

  constructor(
    private apiService: ApiService,
    private sessionService: SessionService,
    private router: Router
  ) {}

  accomodations: Accomodation[] = [];
  newAccomodation: any = {
    name: '',
    city: '',
    address: '',
    priceforone: 0,
    max_guests: 0,
    description: '',
    cover_image: '',
    avgrating: 0,
  };
  selectedImages: File[] = [];
  uploadedImageUrls: string[] = [];
  isUploading: boolean = false;

  reviews: any[] = []; 
  selectedReview: any = null;
  isReviewModalOpen: boolean = false;

  editingUser: any = null;
  editingAcc: any = null;
  editingBooking: any = null;

  newBooking: any = {
    userId: null,
    accommodationId: null,
    startDate: '',
    endDate: '',
    persons: 1,
    totalPrice: 0,
    status: 'confirmed',
  };

  newRoom: any = {
    accomodation_id: null,
    title: '',
    price: 0,
    max_persons: 1,
    description: '',
    image_url: '',
  };

  ngOnInit(): void {
    if (!this.sessionService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    this.loadUsers();
  }

  async createBooking() {
    const payload: any = {
      userId: this.newBooking.userId,
      accommodationId: this.newBooking.accommodationId,
      startDate: this.newBooking.startDate,
      endDate: this.newBooking.endDate,
      persons: this.newBooking.persons,
      totalPrice: this.newBooking.totalPrice,
      status: this.newBooking.status,
    };

    if (!payload.userId || !payload.accommodationId) {
      alert('Kérlek válassz felhasználót és szállást!');
      return;
    }
    if (!payload.startDate || !payload.endDate) {
      alert('Kérlek válassz érkezési és távozási dátumot!');
      return;
    }
    if (!payload.persons || payload.persons < 1) {
      alert('A személyek száma legalább 1 legyen!');
      return;
    }

    const res = await this.apiService.createBooking(payload);
    if (res.status === 201 || res.status === 200) {
      alert('Foglalás sikeresen létrehozva!');
      this.newBooking = {
        userId: null,
        accommodationId: null,
        startDate: '',
        endDate: '',
        persons: 1,
        totalPrice: 0,
        status: 'confirmed',
      };
      this.loadBookings();
    } else {
      alert(res.message || 'Nem sikerült a foglalás létrehozása!');
    }
  }

  isAccActive(acc: any): boolean {
    const v = acc?.active ?? acc?.is_active;
    if (v === true) return true;
    if (v === false) return false;
    if (v === 1 || v === '1') return true;
    if (v === 0 || v === '0') return false;
    return !!v;
  }

  switchTab(tab: 'users' | 'accomodations' | 'reviews' | 'bookings') {
    this.activeTab = tab;
    if (tab === 'users') this.loadUsers();
    if (tab === 'accomodations') this.loadAccomodations();
    if (tab === 'reviews') this.loadReviews();
    if (tab === 'bookings') {
      this.loadBookings();
      this.loadUsers();
      this.loadAccomodations();
    }
  }

  async loadUsers() {
    const res = await this.apiService.selectAll('users');
    if (res.status === 200) {
      this.users = res.data;
      this.currentPageUsers = 1;
    }
  }

  async banUser(id: number) {
    if (confirm('Biztosan ki akarod tiltani ezt a felhasználót?')) {
      const res = await this.apiService.patch(`users/${id}/ban`, {});
      if (res.status === 200) {
        alert('Felhasználó kitiltva!');
        this.loadUsers();
      } else {
        alert('Hiba történt a kitiltás során.');
      }
    }
  }

  async unbanUser(id: number) {
    if (confirm('Biztosan fel akarod oldani ezt a felhasználó kitiltását?')) {
      const res = await this.apiService.patch(`users/${id}/unban`, {});
      if (res.status === 200) {
        alert('Felhasználó feloldva!');
        this.loadUsers();
      } else {
        alert('Hiba történt a feloldás során.');
      }
    }
  }

  async deleteUser(id: number) {
    if (confirm('Biztosan törölni szeretnéd ezt a felhasználót?')) {
      const res = await this.apiService.delete('users', id);
      if (res.status === 200) {
        alert('Felhasználó törölve!');
        this.loadUsers();
      } else {
        alert('Hiba történt a törlés során.');
      }
    }
  }

  startEditUser(user: any) {
    this.editingUser = { ...user };
  }

  cancelEditUser() {
    this.editingUser = null;
  }

  async saveUser() {
    if (!this.editingUser) return;
    const payload: any = {
      name: this.editingUser.name,
      email: this.editingUser.email,
      role: this.editingUser.role,
    };
    const res = await this.apiService.update(
      'users',
      this.editingUser.id,
      payload
    );
    if (res.status === 200) {
      alert('Felhasználó mentve');
      this.editingUser = null;
      this.loadUsers();
    } else {
      alert('Hiba történt a mentés során');
    }
  }

  async toggleUserActive(user: any) {
    const newVal = !(user.active || user.is_active);
    const res = await this.apiService.update('users', user.id, {
      active: newVal,
    });
    if (res.status === 200) {
      alert('Állapot frissítve');
      this.loadUsers();
    } else {
      alert('Hiba történt az állapot frissítésekor');
    }
  }

  async loadAccomodations() {
    const res = await this.apiService.selectAll('accomodations?all=true');
    if (res.status === 200) {
      this.accomodations = res.data;
      this.currentPageAccomodations = 1;
    }
  }

  bookings: any[] = [];

  async loadBookings() {
    const res = await this.apiService.selectAll('bookings');
    if (res.status === 200) {
      this.bookings = res.data;
      this.currentPageBookings = 1;
    }
  }

  startEditBooking(b: any) {
    const clone = { ...b };
    const normalizeDate = (v: any) => {
      if (!v) return v;
      if (typeof v === 'string') {
        if (v.includes('T')) return v.split('T')[0];
        if (v.includes(' ')) return v.split(' ')[0];
        return v;
      }
      try {
        const d = new Date(v);
        if (isNaN(d.getTime())) return v;
        return d.toISOString().split('T')[0];
      } catch {
        return v;
      }
    };

    clone.startDate = normalizeDate(clone.startDate);
    clone.endDate = normalizeDate(clone.endDate);

    this.editingBooking = clone;
  }

  cancelEditBooking() {
    this.editingBooking = null;
  }

  async saveBooking() {
    if (!this.editingBooking) return;

    const payload: any = {
      startDate: this.editingBooking.startDate,
      endDate: this.editingBooking.endDate,
      persons: this.editingBooking.persons,
      totalPrice: this.editingBooking.totalPrice,
      status: this.editingBooking.status,
    };

    const res = await this.apiService.patch(
      `bookings/${this.editingBooking.id}`,
      payload
    );
    if (res.status === 200) {
      alert('Foglalás mentve');
      this.editingBooking = null;
      this.loadBookings();
    } else {
      alert('Hiba történt a mentés során');
    }
  }

  async deleteBooking(id: number) {
    if (confirm('Biztosan törölni szeretnéd ezt a foglalást?')) {
      const res = await this.apiService.delete('bookings', id);
      if (res.status === 200) {
        alert('Foglalás törölve!');
        this.loadBookings();
      } else {
        alert('Hiba történt a törlés során.');
      }
    }
  }

  paged<T>(items: T[], page: number) {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  pageCount(items: any[]) {
    return Math.max(1, Math.ceil(items.length / this.pageSize));
  }

  nights(b: any): number {
    if (!b || !b.startDate || !b.endDate) return 0;
    try {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const diff = end.getTime() - start.getTime();
      const days = Math.round(diff / (1000 * 60 * 60 * 24));
      return isNaN(days) ? 0 : days;
    } catch (e) {
      return 0;
    }
  }

  startEditAcc(acc: any) {
    this.editingAcc = { ...acc };
  }

  cancelEditAcc() {
    this.editingAcc = null;
  }

  async saveAcc() {
    if (!this.editingAcc) return;
    const payload: any = {
      name: this.editingAcc.name,
      city: this.editingAcc.city,
      priceforone: this.editingAcc.priceforone,
      description: this.editingAcc.description,
      cover_image: this.editingAcc.cover_image,
      title: this.editingAcc.title,
      street: this.editingAcc.street,
      full_address: this.editingAcc.full_address,
    };
    const res = await this.apiService.update(
      'accomodations',
      this.editingAcc.id,
      payload
    );
    if (res.status === 200) {
      alert('Szállás mentve');
      this.editingAcc = null;
      this.loadAccomodations();
    } else {
      alert('Hiba történt a mentés során');
    }
  }

  async toggleAccActive(acc: any) {
    const newVal = !this.isAccActive(acc);
    const res = await this.apiService.patch(`accomodations/${acc.id}/toggle-active`, {
      active: newVal,
    });
    if (res.status === 200) {
      alert('Állapot frissítve');
      this.loadAccomodations();
    } else {
      alert('Hiba történt az állapot frissítésekor');
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedImages = Array.from(event.target.files);
    }
  }

  async createAccomodation() {
    if (this.selectedImages.length === 0) {
      alert('Kérlek válassz legalább egy képet!');
      return;
    }

    this.isUploading = true;
    this.uploadedImageUrls = [];

    try {
      const imgbbApiKey = '1167681f3465f44a5054da3cb1406b22';

      for (const image of this.selectedImages) {
        const formData = new FormData();
        formData.append('image', image);

        const imgResponse = await fetch(
          `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const imgData = await imgResponse.json();

        if (imgData.success) {
          this.uploadedImageUrls.push(imgData.data.url);
        } else {
          console.error('Hiba a képfeltöltés során:', imgData);
          alert('Hiba történt az egyik kép feltöltésekor!');
          this.isUploading = false;
          return;
        }
      }

      this.newAccomodation.cover_image = this.uploadedImageUrls[0];
      const res = await this.apiService.insert(
        'accomodations',
        this.newAccomodation
      );

      if (res.status === 200) {
        const newAccomodationId = res.data.insertId;

        for (let i = 0; i < this.uploadedImageUrls.length; i++) {
          await this.apiService.insert('accomodation_images', {
            accomodation_id: newAccomodationId,
            image_path: this.uploadedImageUrls[i],
            sub_index: i,
          });
        }

        alert('Szállás és képek sikeresen létrehozva!');
        this.newAccomodation = {
          name: '',
          city: '',
          address: '',
          priceforone: 0,
          max_guests: 0,
          description: '',
          cover_image: '',
          avgrating: 0,
        };
        this.selectedImages = [];
        this.uploadedImageUrls = [];
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        this.loadAccomodations();
      } else {
        alert('Hiba történt a mentés során: ' + res.message);
      }
    } catch (error) {
      console.error(error);
      alert('Váratlan hiba történt!');
    } finally {
      this.isUploading = false;
    }
  }

  async deleteAccomodation(id: number) {
    if (confirm('Biztosan törölni szeretnéd ezt a szállást?')) {
      const res = await this.apiService.delete('accomodations', id);
      if (res.status === 200) {
        alert('Szállás törölve!');
        this.loadAccomodations();
      } else {
        alert('Hiba történt a törlés során.');
      }
    }
  }

  async loadReviews() {
    const res = await this.apiService.selectAll('reviews');
    if (res.status === 200) {
      
      this.reviews = res.data.map((r: any) => ({
        ...r,
        comment: r.review_text,
      }));
    }
  }

  openReviewModal(review: any) {
    this.selectedReview = { ...review };
    this.isReviewModalOpen = true;
  }

  closeReviewModal() {
    this.isReviewModalOpen = false;
    this.selectedReview = null;
  }

  async updateReview() {
    if (!this.selectedReview) return;

    const res = await this.apiService.update(
      'reviews',
      this.selectedReview.id,
      this.selectedReview
    );
    if (res.status === 200) {
      alert('Vélemény módosítva!');
      this.closeReviewModal();
      this.loadReviews();
    } else {
      alert('Hiba a módosítás során.');
    }
  }

  async deleteReview(id: number) {
    if (confirm('Biztosan törölni szeretnéd ezt a véleményt?')) {
      const res = await this.apiService.delete('reviews', id);
      if (res.status === 200) {
        alert('Vélemény törölve!');
        this.loadReviews();
      } else {
        alert('Hiba történt a törlés során.');
      }
    }
  }

  async createRoom() {
    if (!this.newRoom.accomodation_id) {
      alert('Válassz szállást a szoba létrehozásához!');
      return;
    }

    const payload = {
      accomodation_id: this.newRoom.accomodation_id,
      title: this.newRoom.title,
      price: this.newRoom.price,
      max_persons: this.newRoom.max_persons,
      description: this.newRoom.description,
      image_url: this.newRoom.image_url,
    };

    const res = await this.apiService.insert('rooms', payload);
    if (res.status === 200) {
      alert('Szoba hozzáadva');
      // resetelés
      this.newRoom = {
        accomodation_id: null,
        title: '',
        price: 0,
        max_persons: 1,
        description: '',
        image_url: '',
      };
    } else {
      alert('Hiba történt a szoba létrehozásakor');
    }
  }
}
