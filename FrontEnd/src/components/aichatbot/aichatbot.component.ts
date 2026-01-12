import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIMessage } from '../../interfaces/aimessageinterface';
import { ApiService } from '../../services/api.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-aichatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aichatbot.component.html',
  styleUrl: './aichatbot.component.scss',
})
export class AichatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;

  isOpen = false;
  messages: AIMessage[] = [];
  userMessage = '';
  isLoading = false;
  private shouldScroll = false;

  constructor(
    private apiService: ApiService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.chatService.isOpen$.subscribe((isOpen) => {
      this.isOpen = isOpen;
      if (isOpen) {
        this.shouldScroll = true;
      }
    });

    this.loadMessagesFromCookie();

    if (this.messages.length === 0) {
      this.addInitialMessage();
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat() {
    this.chatService.toggleChat();
  }

  addInitialMessage() {
    const initialMessage: AIMessage = {
      id: this.generateId(),
      text: 'Szia! Én a FoglaljLe AI asszisztense vagyok. Tegyél fel bármilyen kérdést, amit csak szeretnél! :)',
      sender: 'ai',
      timestamp: new Date(),
    };
    this.messages.push(initialMessage);
    this.saveMessagesToCookie();
    this.shouldScroll = true;
  }

  async sendMessage() {
    if (!this.userMessage.trim() || this.isLoading) return;

    const userMsg: AIMessage = {
      id: this.generateId(),
      text: this.userMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    this.messages.push(userMsg);
    this.saveMessagesToCookie();
    this.shouldScroll = true;

    const messageToSend = this.userMessage;
    this.userMessage = '';
    this.isLoading = true;

    try {
      const response = await this.apiService.sendAIMessage(messageToSend);

      if (response.status === 200 && response.data) {
        const aiMsg: AIMessage = {
          id: this.generateId(),
          text: response.data.response,
          sender: 'ai',
          timestamp: new Date(),
        };
        this.messages.push(aiMsg);
        this.saveMessagesToCookie();
        this.shouldScroll = true;
      }
    } catch (error) {
      console.error('Hiba az üzenet küldésekor:', error);
      const errorMsg: AIMessage = {
        id: this.generateId(),
        text: 'Sajnos hiba történt. Kérlek próbáld újra!',
        sender: 'ai',
        timestamp: new Date(),
      };
      this.messages.push(errorMsg);
      this.saveMessagesToCookie();
      this.shouldScroll = true;
    } finally {
      this.isLoading = false;
    }
  }

  saveMessagesToCookie() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);

    const cookieValue = encodeURIComponent(JSON.stringify(this.messages));
    document.cookie = `aiChatMessages=${cookieValue}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
  }

  loadMessagesFromCookie() {
    const cookies = document.cookie.split(';');
    const chatCookie = cookies.find((c) =>
      c.trim().startsWith('aiChatMessages=')
    );

    if (chatCookie) {
      try {
        const cookieValue = chatCookie.split('=')[1];
        this.messages = JSON.parse(decodeURIComponent(cookieValue));
      } catch (error) {
        console.error('Hiba az üzenetek betöltésekor a cookie-ból:', error);
        this.messages = [];
      }
    }
  }

  clearChat() {
    this.messages = [];
    document.cookie =
      'aiChatMessages=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    this.addInitialMessage();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private scrollToBottom() {
    if (this.chatMessagesContainer) {
      try {
        this.chatMessagesContainer.nativeElement.scrollTop =
          this.chatMessagesContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Görgetési hiba:', err);
      }
    }
  }
}
