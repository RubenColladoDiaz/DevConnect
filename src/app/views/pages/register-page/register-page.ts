import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-page',
  standalone: false,
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onRegister() {
    if (this.registerForm.invalid) return;

    this.http.post('http://localhost:3000/register', this.registerForm.value).subscribe({
      next: (res: any) => {
        localStorage.setItem('user', JSON.stringify(res.user));
        this.router.navigate(['/login']);
      },
      error: () => {
        alert('No se pudo registrar. Revisa los datos o si el backend esta corriendo.');
      },
    });
  }
}
