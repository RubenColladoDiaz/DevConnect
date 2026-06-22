import { Component, signal, WritableSignal } from '@angular/core';
import { User } from '../../../shared/types/User';

@Component({
  selector: 'app-my-account-page',
  standalone: false,
  templateUrl: './my-account-page.html',
  styleUrl: './my-account-page.css',
})
export class MyAccountPage {
  user: WritableSignal<User> = signal<User>(JSON.parse(localStorage.getItem('user') || '{}'));
}
