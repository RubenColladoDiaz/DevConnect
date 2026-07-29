import { Component, signal } from '@angular/core';
import { WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from './shared/services/users-service';
import { AuthService } from './shared/services/auth-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('DevConnect');

  user!: WritableSignal<any>;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.user = this.authService.user;
  }

  get username(): string {
    return this.user().username || '';
  }

  logout(): void {
    this.usersService.Logout().subscribe({
      next: () => {
        this.authService.clearUser();
        this.router.navigate(['/']);
      },
      error: () => {
        this.authService.clearUser();
        this.router.navigate(['/']);
      },
    });
  }

  clearSession(): void {
    this.authService.clearUser();
    this.router.navigate(['/']);
  }
}
