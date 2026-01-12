import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SessionService } from '../../services/session.service';
import { NotificationsService } from '../../services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  user: any = null;
  loading = false;
  editMode = false;

  changePasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  editProfileForm = {
    name: '',
    email: ''
  };

  constructor(
    private apiService: ApiService,
    private sessionService: SessionService,
    private notificationService: NotificationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.sessionService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    this.user = this.sessionService.getUser();
    this.resetForms();
    this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.apiService.selectAll('users/me');
      if (res.status === 200 && res.data) {
        this.user = res.data;
        this.sessionService.setUser(res.data);
        this.resetForms();
      }
    } finally {
      this.loading = false;
    }
  }

  resetForms(): void {
    this.editMode = false;
    this.changePasswordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.editProfileForm = {
      name: this.user?.name || '',
      email: this.user?.email || ''
    };
  }

  enableEditMode(): void {
    this.editMode = true;
    this.editProfileForm = {
      name: this.user?.name || '',
      email: this.user?.email || ''
    };
  }

  cancelEdit(): void {
    this.resetForms();
  }

  async updateProfile(): Promise<void> {
    if (!this.editProfileForm.name.trim() || !this.editProfileForm.email.trim()) {
      this.notificationService.error('Minden mező kitöltése kötelező!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editProfileForm.email)) {
      this.notificationService.error('Érvénytelen e-mail cím!');
      return;
    }

    this.loading = true;
    try {
      const response = await this.apiService.patch('users/me', {
        name: this.editProfileForm.name.trim(),
        email: this.editProfileForm.email.trim()
      });

      if (response.status === 200) {
        this.notificationService.success('Profil sikeresen frissítve!');
        const nextUser = response.data?.user || { ...this.user, name: this.editProfileForm.name.trim(), email: this.editProfileForm.email.trim() };
        this.user = nextUser;
        this.sessionService.setUser(nextUser);
        this.resetForms();
      } else {
        this.notificationService.error('Hiba történt a frissítés során!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Hiba történt a frissítés során!';
      this.notificationService.error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  async changePassword(): Promise<void> {
    if (!this.changePasswordForm.currentPassword || !this.changePasswordForm.newPassword || !this.changePasswordForm.confirmPassword) {
      this.notificationService.error('Minden mező kitöltése kötelező!');
      return;
    }

    if (this.changePasswordForm.newPassword !== this.changePasswordForm.confirmPassword) {
      this.notificationService.error('A jelszavak nem egyeznek!');
      return;
    }

    const passwdRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwdRegExp.test(this.changePasswordForm.newPassword)) {
      this.notificationService.error('A jelszónak legalább 8 karakter hosszúnak kell lennie, és tartalmaznia kell legalább 1 nagybetűt, 1 kisbetűt és 1 számot!');
      return;
    }

    this.loading = true;
    try {
      const response = await this.apiService.post('/users/me/change-password', {
        currentPassword: this.changePasswordForm.currentPassword,
        newPassword: this.changePasswordForm.newPassword
      });

      if (response.status === 200) {
        this.notificationService.success('Jelszó sikeresen megváltoztatva!');
        this.resetForms();
      } else {
        this.notificationService.error('Hiba történt a jelszó módosítása során!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Hiba történt a jelszó módosítása során!';
      this.notificationService.error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  async deleteAccount(): Promise<void> {
    if (!confirm('Biztosan törölni szeretnéd a fiókodat? Ez a művelet nem vonható vissza!')) {
      return;
    }

    this.loading = true;
    try {
      const response = await this.apiService.deletePath('/users/me');

      if (response.status === 200) {
        this.notificationService.success('Fiók sikeresen törölve!');
        this.sessionService.clearUser();
        this.router.navigate(['/']);
      } else {
        this.notificationService.error('Hiba történt a fiók törlése során!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Hiba történt a fiók törlése során!';
      this.notificationService.error(errorMessage);
    } finally {
      this.loading = false;
    }
  }
}
