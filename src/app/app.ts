import { Component, signal } from '@angular/core';
import { User } from './shared/types/User';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('DevConnect');

  user: User = JSON.parse(localStorage.getItem('user') || '{}');
  username = this.user.username;

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.user = {} as User;
    this.username = '';
    window.location.reload();
  }
}
