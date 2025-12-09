import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../interfaces/user';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly cookieName = 'mm_user'; // Cookie név, readonly attr.
  private readonly cookieMaxAgeDays = 7; // 7 napig érvényes

  private userSubject = new BehaviorSubject<User | null>( // Inicializalas cooki al
    this.readUserFromCookie()
  );
  user$ = this.userSubject.asObservable();

  getUser(): User | null {
    return this.userSubject.getValue();
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  public isAdmin(): boolean {
    const user = this.getUser();
    return user?.role.role === 'admin'; //! ROLE KULON ROLE TYPE MIATT - de használható: unknown as any
  }

  setUser(user: any): void {
    const normalized = this.normalizeUser(user);
    this.setCookie(
      this.cookieName,
      JSON.stringify(normalized),
      this.cookieMaxAgeDays // Max nap ig érvényes
    );
    this.userSubject.next(normalized); //! Beállítja a cookie-t és frissíti a subject-et
  }

  clearUser(): void {
    this.deleteCookie(this.cookieName);
    this.userSubject.next(null);
  }

  private readUserFromCookie(): User | null {
    try {
      const raw = this.getCookie(this.cookieName);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return this.normalizeUser(parsed);
    } catch {
      return null;
    }
  }

  private normalizeUser(input: any): User {
    const src = input && input.user ? input.user : input;
    const roleValue =
      typeof src?.role === 'string' ? src.role : src?.role?.role;
    const normalized: User = {
      //ért. vagy üres
      id: src?.id || '',
      name: src?.name || '',
      email: src?.email || '',
      password: '',
      role: { role: roleValue === 'admin' ? 'admin' : 'user' }, // ROLE.ROLE
    };
    return normalized;
  }

  private setCookie(name: string, value: string, days: number) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // napok ms-ben
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; ${expires}; path=/; SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const nameEQForTheCookie = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQForTheCookie) === 0)
        return decodeURIComponent(
          c.substring(nameEQForTheCookie.length, c.length)
        );
    }
    return null;
  }

  private deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1 00:00:00 UTC; path=/; SameSite=Lax`; // beállítjuk a lejárati dátumát egy múltbeli időpontra
  }
}
