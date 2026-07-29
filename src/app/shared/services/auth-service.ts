import { Injectable, signal } from '@angular/core';
import { User } from '../types/User';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user = signal<User>(JSON.parse(localStorage.getItem('user') || '{}'));

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.user.set(user);
  }

  clearUser(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.user.set({} as User);
  }
}
