import { Component } from '@angular/core';
import { SzallasokComponent } from '../szallasok/szallasok.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [SzallasokComponent, CommonModule],
  templateUrl: './landingpage.component.html',
  styleUrl: './landingpage.component.scss',
})
export class LandingpageComponent {}
