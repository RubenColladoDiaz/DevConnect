import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  user = JSON.parse(localStorage.getItem('user') || '{}');
  username = this.user.username;
}
