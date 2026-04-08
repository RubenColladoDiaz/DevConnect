import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('DevConnect');

  user = JSON.parse(localStorage.getItem('user') || '{}');
  username = this.user.username;
}
