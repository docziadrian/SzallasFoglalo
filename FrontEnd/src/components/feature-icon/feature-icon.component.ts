import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feature-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.class]="className" viewBox="0 0 24 24" aria-hidden="true">
      <ng-container [ngSwitch]="iconKey">
        <!-- Card -->
        <g *ngSwitchCase="'card'">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <rect x="4" y="9" width="16" height="2" fill="currentColor"/>
          <rect x="4" y="14" width="4" height="2" fill="currentColor"/>
        </g>
        
        <!-- Parking -->
        <g *ngSwitchCase="'parking'">
          <rect x="4" y="3" width="16" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M10 8h3.5a2.5 2.5 0 0 1 0 5H10V8z" fill="currentColor"/>
        </g>
        
        <!-- WiFi -->
        <g *ngSwitchCase="'wifi'">
          <path d="M2 8a16 16 0 0 1 20 0" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M5 11a11 11 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M8 14a6 6 0 0 1 8 0" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
        </g>
        
        <!-- Family -->
        <g *ngSwitchCase="'family'">
          <circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="16" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M4 18v-1.5A3.5 3.5 0 0 1 7.5 13H8.5A3.5 3.5 0 0 1 12 16.5V18" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M12 18v-1.5A3.5 3.5 0 0 1 15.5 13h1A3.5 3.5 0 0 1 20 16.5V18" fill="none" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Pet -->
        <g *ngSwitchCase="'pet'">
          <circle cx="7" cy="8" r="1.6" fill="currentColor"/>
          <circle cx="12" cy="6" r="1.6" fill="currentColor"/>
          <circle cx="17" cy="8" r="1.6" fill="currentColor"/>
          <circle cx="10" cy="12" r="1.6" fill="currentColor"/>
          <path d="M8 18c0-2.2 1.8-4 4-4s4 1.8 4 4" fill="none" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Breakfast -->
        <g *ngSwitchCase="'breakfast'">
          <rect x="4" y="7" width="9" height="9" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M15 9h2.5a2.5 2.5 0 0 1 0 5H15" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M4 18h13" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Wellness -->
        <g *ngSwitchCase="'wellness'">
          <path d="M6 18c1 1 2.5 1.5 4 1.5s3-.5 4-1.5" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M8 14c.8.9 2 1.5 3.5 1.5S14.2 14.9 15 14" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M10 10c.5.7 1.3 1 2 1s1.5-.3 2-1" fill="none" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- AC -->
        <g *ngSwitchCase="'ac'">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M12 3v3M12 18v3M4.2 5.2L6.5 7.5M17.5 16.5L19.8 18.8M3 12h3M18 12h3M4.2 18.8L6.5 16.5M17.5 7.5L19.8 5.2" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- View -->
        <g *ngSwitchCase="'view'">
          <path d="M3 18l5-8 4 6 3-4 6 6H3z" fill="currentColor"/>
          <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
        </g>
        
        <!-- Garden -->
        <g *ngSwitchCase="'garden'">
          <path d="M12 20v-8M8 14c-2 0-3.5-1.7-3.5-3.5 0-1.2.7-2.3 1.8-2.9M16 14c2 0 3.5-1.7 3.5-3.5 0-1.2-.7-2.3-1.8-2.9M10 6c0-1.7 1.3-3 3-3" fill="none" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Bike -->
        <g *ngSwitchCase="'bike'">
          <circle cx="6" cy="17" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="18" cy="17" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M8 17l3-7h3l-2 5M11 6h2l1 3" fill="none" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Self Check-in -->
        <g *ngSwitchCase="'selfcheckin'">
          <rect x="6" y="3" width="12" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="8" r="1.2" fill="currentColor"/>
          <path d="M9 14l2 2 4-4" fill="none" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Pool -->
        <g *ngSwitchCase="'pool'">
          <path d="M6 7c0-2 1.5-3 3-3s3 1 3 3v10M12 7c0-2 1.5-3 3-3s3 1 3 3v10" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M4 18c1 .7 2 .7 3 0s2-.7 3 0 2 .7 3 0 2-.7 3 0 2 .7 3 0" fill="none" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Gym -->
        <g *ngSwitchCase="'gym'">
          <rect x="4" y="9" width="3" height="6" fill="currentColor"/>
          <rect x="17" y="9" width="3" height="6" fill="currentColor"/>
          <rect x="8" y="10" width="8" height="4" fill="currentColor"/>
          <path d="M4 10V8M4 16v2M20 10V8M20 16v2" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Wine -->
        <g *ngSwitchCase="'wine'">
          <path d="M8 3h8l-1 6a3 3 0 0 1-3 2.5A3 3 0 0 1 9 9L8 3z" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M12 11.5V18M9 21h6" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Sauna -->
        <g *ngSwitchCase="'sauna'">
          <path d="M6 18c1 1 2.5 1.5 4 1.5s3-.5 4-1.5" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M8 14c.8.9 2 1.5 3.5 1.5S14.2 14.9 15 14" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M10 10c.5.7 1.3 1 2 1s1.5-.3 2-1" fill="none" stroke="currentColor" stroke-width="2"/>
        </g>
        
        <!-- Default -->
        <g *ngSwitchDefault>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
        </g>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class FeatureIconComponent {
  @Input() iconKey: string = 'default';
  @Input() className: string = 'w-6 h-6';
}