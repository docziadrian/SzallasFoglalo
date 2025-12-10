import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SessionService } from '../../../services/session.service';
import { NotificationsService } from '../../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  @Output() switchToRegistration = new EventEmitter<void>();

  loginUser = {
    email: '',
    password: '',
  };
  rememberMe = false;

  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    private notificationService: NotificationsService,
    private router: Router
  ) {}

  async loginHandler() {
    if (!this.loginUser.email || !this.loginUser.password) {
      this.notificationService.error('Nem adtál meg minden adatot!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.loginUser.email)) {
      this.notificationService.error('Hibás e-mail cím formátum!');
      return;
    }

    try {
      const response = await this.authService.login(
        this.loginUser.email,
        this.loginUser.password
      );

      if (response.data) {
        this.sessionService.setUser(response.data);
        this.notificationService.success('Sikeres bejelentkezés!');

        setTimeout(() => {
          this.router.navigate(['/']).then(() => {
            window.location.reload();
          });
        }, 500);
      } else {
        this.notificationService.error('Hibás belépési adatok!');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Hiba történt a bejelentkezés során!';
      this.notificationService.error(errorMessage);
    }
  }

  forgotPwdHandler() {
    this.router.navigate(['/lostpass']);
  }

  switchToRegistrationHandler() {
    this.switchToRegistration.emit();
  }
}
