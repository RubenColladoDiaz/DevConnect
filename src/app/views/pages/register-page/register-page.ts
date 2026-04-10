import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UsersService } from '../../../shared/services/users-service';

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
  /**
   * Form group where we will modify username and password.
   * @type {FormGroup}
   */
  registerForm: FormGroup;

  /**
   * Text message where we show possible errors.
   * @type {string}
   * @default {''}
   */
  message: string = '';

  /**
   * Constructor where we create essencial params for different methods and we validate inputs from the form.
   * @param {FormBuilder} fb Builder for create the FormGroup.
   * @param {HttpClient} http Property that is used to make API calls.
   * @param {Router} router Property that is used to navigate within different web routes.
   */
  constructor(
    private fb: FormBuilder,
    private userService: UsersService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  /**
   * This POST method register the user into the paltform saving the user object in localStorage.
   * @type {void}
   * @returns This method does not return any data.
   */
  Register(): void {
    if (this.registerForm.invalid) return;

    const { username, email, password } = this.registerForm.value;

    this.userService.Register(username, email, password).subscribe({
      next: (res: any) => {
        localStorage.setItem('user', JSON.stringify(res.user));
        this.router.navigate(['/']);
      },
      error: (res: any) => {
        this.message = res.error.message ?? 'Unexpected error';
      },
    });
  }
}
