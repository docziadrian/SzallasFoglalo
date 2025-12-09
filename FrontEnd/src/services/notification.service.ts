import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Message } from '../interfaces/message';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private messageSubject = new BehaviorSubject<Message | null>(null);

  message$ = this.messageSubject.asObservable(); // Observable, amire fel lehet iratkozni -> kívülről erre lehet feliratkozni

  // Automatikus eltűnés időtartama (ms)
  readonly autoHideMs = 2000;

  constructor() {}

  show(severity: Message['severity'], title: string, msg: string) {
    this.messageSubject.next({ severity, title, msg });
    // TODO: Ha egy új üzenet jön, felülírjuk a régit és újraindítjuk az időzítőt -> javítani
    setTimeout(() => {
      this.hide();
    }, this.autoHideMs);
  }

  info(msg: string, title: string = 'Információ') {
    this.show('info', title, msg);
  }

  warn(msg: string, title: string = 'Figyelmeztetés') {
    this.show('warning', title, msg);
  }

  error(msg: string, title: string = 'Hiba') {
    this.show('error', title, msg);
  }

  success(msg: string, title: string = 'Siker') {
    this.show('success', title, msg);
  }

  hide() {
    this.messageSubject.next(null);
  }
}
