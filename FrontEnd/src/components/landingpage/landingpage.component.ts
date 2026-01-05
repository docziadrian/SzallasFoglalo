import { Component } from '@angular/core';
import { SzallasokComponent } from '../szallasok/szallasok.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [SzallasokComponent, CommonModule, FormsModule],
  templateUrl: './landingpage.component.html',
  styleUrl: './landingpage.component.scss',
})
export class LandingpageComponent {
  destination: string = '';
  startDate: string = '';
  endDate: string = '';
  people: number = 1;

  constructor(private router: Router, private chatService: ChatService) {}

  openChat() {
    this.chatService.openChat();
  }

  // Inputoknak min = MAI dátum
  minDate: string = new Date().toISOString().split('T')[0];
  maxDate: string = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  )
    .toISOString()
    .split('T')[0];

  validateInputs(): boolean {
    if (!this.destination || !this.startDate || !this.endDate) {
      alert('Kérjük adja meg a célállomást, érkezési és távozási dátumot.');
      return false;
    }

    // Ha a dátumok érvényesek
    if (new Date(this.startDate) > new Date(this.endDate)) {
      alert(
        'A távozási dátumnak későbbinek kell lennie, mint az érkezési dátum.'
      );
      return false;
    }

    // Ha nem múltbeli dátumok
    if (new Date(this.startDate) <= new Date()) {
      alert('Az érkezési dátumnak a jövőben kell lennie.');
      return false;
    }
    if (new Date(this.endDate) < new Date()) {
      alert('A távozási dátumnak a jövőben kell lennie.');
      return false;
    }

    return true;
  }

  search() {
    // Navigáljon át a /accomodations/<destination> oldalra
    const destination = this.destination;
    const startDate = this.startDate;
    const endDate = this.endDate;
    const people = this.people;
    if (!this.validateInputs()) {
      return;
    }
    const path = '/accomodations/destination/' + destination;
    this.router.navigate([path], {
      queryParams: { startDate, endDate, people },
    });
  }
}
