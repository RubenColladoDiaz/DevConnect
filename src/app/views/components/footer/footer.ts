import { Component } from '@angular/core';
import { AuthService } from '../../../shared/services/auth-service';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  constructor(private authService: AuthService) {}

  get isLoggedIn(): boolean {
    return !!this.authService.user().username;
  }
}
