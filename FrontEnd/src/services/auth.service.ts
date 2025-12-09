import { Injectable } from '@angular/core';
import { BehaviorSubject, retry } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenName = environment.tokenName;

  private isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedIn.asObservable();

  constructor() {}

  hasToken(): boolean {
    const session = sessionStorage.getItem(this.tokenName);
    if (session) return true;

    const local = localStorage.getItem(this.tokenName);
    if (local) {
      sessionStorage.setItem(this.tokenName, local);
      return true;
    }

    return false;
  }

  storeUser(token: string) {
    localStorage.setItem(this.tokenName, token);
  }

  login(token: string) {
    sessionStorage.setItem(this.tokenName, token);
    this.isLoggedIn.next(true);
  }

  logout() {
    sessionStorage.removeItem(this.tokenName);
    localStorage.removeItem(this.tokenName);
    this.isLoggedIn.next(false);
  }

  loggedUser() {
    const token = sessionStorage.getItem(this.tokenName);

    if (token) {
      return JSON.parse(token);
    }

    return null;
  }

  isAdmin(): boolean {
    const user = this.loggedUser();
    if (user) return user[0].role === 'admin';
    return false;
  }

  isLoggedUser(): boolean {
    return this.isLoggedIn.value;
  }
}
