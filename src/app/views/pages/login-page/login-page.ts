import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login-page',
  standalone: false,
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  username: string = "";
  password: string = "";

  login(f:NgForm) {
    this.username = f.value.username;
    this.password = f.value.password;
  }
}
