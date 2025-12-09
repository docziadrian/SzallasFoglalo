import { Injectable } from '@angular/core';
import axios from 'axios';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3333/users';

  constructor(private sessionService: SessionService) {}

  register(name: string, email: string, password: string, confirm: string) {
    return axios.post(
      `${this.apiUrl}/registration`,
      { name, email, password, confirm },
      { withCredentials: true }
    );
  }

  login(email: string, password: string) {
    return axios.post(
      `${this.apiUrl}/login`,
      { email, password },
      { withCredentials: true }
    );
  }

  logout() {
    this.sessionService.clearUser();
    return Promise.resolve();
  }

  me() {
    return Promise.resolve(this.sessionService.getUser());
  }
}
