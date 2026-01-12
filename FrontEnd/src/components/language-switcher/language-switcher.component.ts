import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lang-switcher" (click)="$event.stopPropagation()">
      <button
        type="button"
        class="lang-btn"
        (click)="toggleOpen()"
        [attr.aria-expanded]="open"
        aria-label="Language"
        title="Language"
      >
        <span class="lang-icon">🌐</span>
        <span class="lang-code">{{ currentLang.toUpperCase() }}</span>
      </button>

      <div *ngIf="open" class="lang-menu" role="menu">
        <button type="button" class="lang-item" (click)="setLang('hu')">HU</button>
        <button type="button" class="lang-item" (click)="setLang('en')">EN</button>
        <button type="button" class="lang-item" (click)="setLang('de')">DE</button>
      </div>
    </div>
  `,
  styles: [
    `
      .lang-switcher {
        position: fixed;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1000;
      }

      .lang-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        background: #ffffff;
        padding: 10px 12px;
        border-radius: 9999px;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
        cursor: pointer;
        user-select: none;
      }

      .lang-btn:hover {
        background: #f9fafb;
      }

      .lang-icon {
        font-size: 16px;
        line-height: 1;
      }

      .lang-code {
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.06em;
        color: #111827;
      }

      .lang-menu {
        position: absolute;
        left: 0;
        top: calc(100% + 10px);
        display: flex;
        flex-direction: column;
        min-width: 92px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.16);
        overflow: hidden;
      }

      .lang-item {
        padding: 10px 12px;
        text-align: left;
        background: transparent;
        border: none;
        cursor: pointer;
        font-weight: 600;
        color: #111827;
      }

      .lang-item:hover {
        background: #f3f4f6;
      }
    `,
  ],
})
export class LanguageSwitcherComponent implements OnInit {
  open = false;
  currentLang = 'hu';

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    const saved = (localStorage.getItem('lang') || '').toLowerCase();
    const initial = saved === 'hu' || saved === 'en' || saved === 'de' ? saved : 'hu';

    this.translate.setDefaultLang('hu');
    this.setLang(initial, false);
  }

  toggleOpen() {
    this.open = !this.open;
  }

  @HostListener('document:click')
  onDocClick() {
    this.open = false;
  }

  setLang(lang: 'hu' | 'en' | 'de', close = true) {
    this.currentLang = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);

    if (close) this.open = false;
  }
}
