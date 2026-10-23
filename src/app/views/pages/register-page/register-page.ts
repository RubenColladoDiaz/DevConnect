import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from '../../../shared/services/users-service';
import { AuthService } from '../../../shared/services/auth-service';

/**
 * Register component where the user will be able to register his data in the platform.
 */
@Component({
  selector: 'app-register-page',
  standalone: false,
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  registerForm: FormGroup;

  message: string = '';

  technologyInput: string = '';
  selectedTechnologies: string[] = [];
  location = '';

  availableTechnologies: string[] = [
    'Angular',
    'React',
    'Vue',
    'JavaScript',
    'TypeScript',
    'HTML',
    'CSS',
    'Java',
    'Spring Boot',
    'C#',
    '.NET',
    'PHP',
    'Laravel',
    'Python',
    'Django',
    'Node.js',
    'Express',
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Docker',
    'Git',
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UsersService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      display_name: ['', Validators.required],
      stack: [[], [Validators.required, Validators.minLength(1)]],
    });
  }

  addTechnology(event: Event) {
    event.preventDefault();

    const technology = this.technologyInput.trim();
    if (!technology) return;

    const technologyExists = this.selectedTechnologies.some(
      (item) => item.toLowerCase() === technology.toLowerCase(),
    );

    if (technologyExists) {
      this.technologyInput = '';
      return;
    }

    this.selectedTechnologies.push(technology);

    this.registerForm.patchValue({
      stack: this.selectedTechnologies,
    });

    this.technologyInput = '';
  }

  removeTechnology(technology: string): void {
    this.selectedTechnologies = this.selectedTechnologies.filter((item) => item !== technology);

    this.registerForm.patchValue({
      stack: this.selectedTechnologies,
    });
  }

  Register(): void {
    if (this.registerForm.invalid) return;

    const { username, email, password, display_name, stack } = this.registerForm.value;

    this.userService
      .Register(username, email, password, display_name, stack, this.location.trim() || 'Unknown')
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res.token);
          this.authService.setUser(res.user);
          this.userService.UpdatePresence().subscribe({
            error: (error) => console.error('Error setting online status:', error),
          });
          this.router.navigate(['/']);
        },
        error: (res: any) => {
          this.message = res.error.message ?? 'Unexpected error';
        },
      });
  }
}
