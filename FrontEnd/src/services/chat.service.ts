import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpenSubject.asObservable();

  openChat() {
    this.isOpenSubject.next(true);
  }

  closeChat() {
    this.isOpenSubject.next(false);
  }

  toggleChat() {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }
}
