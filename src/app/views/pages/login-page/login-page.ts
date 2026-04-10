import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UsersService } from '../../../shared/services/users-service';

/**
 * Login component where the user will be able to login in a SQL Database.
 */
@Component({
  selector: 'app-login-page',
  standalone: false,
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  /**
   * Form group where we will modify username and password.
   * @type {FormGroup}
   */
  loginForm: FormGroup;

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
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  /**
   * This POST method log in the user into the paltform saving the user object in localStorage.
   * @type {void}
   * @returns This method does not return any data.
   */
  Login(): void {
    if (this.loginForm.invalid) return;

    const { username, password } = this.loginForm.value;

    this.userService.Login(username, password).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.router.navigate(['/']);
      },
      error: (res: any) => {
        this.message = res.error.message ?? 'Unexpected error';
      },
    });
  }
}
