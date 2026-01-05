import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistrationComponent } from '../auth/registration/registration.component';
import { LoginComponent } from '../auth/login/login.component';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RegistrationComponent, LoginComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  showRegistrationPopup: boolean = false;
  showLoginPopup: boolean = false;
  showMobileMenu: boolean = false;
  showUserMenu: boolean = false;

  isLoggedIn: boolean = false;
  userName: string = '';
  userInitials: string = '';
  isAdmin: boolean = false;

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
    private router: Router,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.sessionService.user$.subscribe((user) => {
      this.isLoggedIn = !!user;
      if (user) {
        this.userName = user.name;
        this.userInitials = this.getInitials(user.name);
        this.isAdmin = user.role.role === 'admin';
      } else {
        this.userName = '';
        this.userInitials = '';
        this.isAdmin = false;
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  openRegistrationPopup() {
    this.showRegistrationPopup = true;
    this.showLoginPopup = false;
    this.showMobileMenu = false;
    document.body.style.overflow = 'hidden';
  }

  closeRegistrationPopup() {
    this.showRegistrationPopup = false;
    document.body.style.overflow = 'auto';
  }

  openLoginPopup() {
    this.showLoginPopup = true;
    this.showRegistrationPopup = false;
    this.showMobileMenu = false;
    document.body.style.overflow = 'hidden';
  }

  closeLoginPopup() {
    this.showLoginPopup = false;
    document.body.style.overflow = 'auto';
  }

  switchToLogin() {
    this.showRegistrationPopup = false;
    this.showLoginPopup = true;
  }

  switchToRegistration() {
    this.showLoginPopup = false;
    this.showRegistrationPopup = true;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
    this.showUserMenu = false;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  async logout() {
    await this.authService.logout();
    this.showUserMenu = false;
    this.showMobileMenu = false;
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  openChat() {
    this.chatService.openChat();
  }
}
